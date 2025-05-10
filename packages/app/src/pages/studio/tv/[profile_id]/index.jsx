import React from "react"
import * as antd from "antd"

import Streaming from "@models/spectrum"

import useCenteredContainer from "@hooks/useCenteredContainer"

import ProfileHeader from "./header"

import LiveTab from "./tabs/Live"
import StreamConfiguration from "./tabs/StreamConfiguration"
import RestreamManager from "./tabs/RestreamManager"
import MediaUrls from "./tabs/MediaUrls"

import "./index.less"

const KeyToComponent = {
	live: LiveTab,
	configuration: StreamConfiguration,
	restreams: RestreamManager,
	media_urls: MediaUrls,
}

const useSpectrumWS = () => {
	const client = React.useMemo(() => Streaming.createWebsocket(), [])

	React.useEffect(() => {
		client.connect()

		return () => {
			client.destroy()
		}
	}, [])

	return client
}

const ProfileData = (props) => {
	const { profile_id } = props.params

	if (!profile_id) {
		return null
	}

	useCenteredContainer(false)

	const ws = useSpectrumWS()

	const [loading, setLoading] = React.useState(false)
	const [fetching, setFetching] = React.useState(true)
	const [error, setError] = React.useState(null)
	const [profile, setProfile] = React.useState(null)
	const [selectedTab, setSelectedTab] = React.useState("live")
	const [streamHealth, setStreamHealth] = React.useState(null)
	const streamHealthIntervalRef = React.useRef(null)

	async function fetchStreamHealth() {
		if (!ws) {
			return false
		}

		const health = await ws.call("stream:health", profile_id)

		setStreamHealth(health)
	}

	async function fetchProfileData(idToFetch) {
		setFetching(true)
		setError(null)

		try {
			const result = await Streaming.getProfile(idToFetch)

			if (result) {
				setProfile(result)
			} else {
				setError({
					message:
						"Profile not found or an error occurred while fetching.",
				})
			}
		} catch (err) {
			console.error("Error fetching profile:", err)
			setError(err)
		} finally {
			setFetching(false)
		}
	}

	async function handleProfileUpdate(key, value) {
		if (!profile || !profile._id) {
			antd.message.error("Profile data is not available for update.")
			return false
		}

		setLoading(true)

		try {
			const updatedProfile = await Streaming.updateProfile(profile._id, {
				[key]: value,
			})

			antd.message.success("Change applyed")
			setProfile(updatedProfile)
		} catch (err) {
			console.error(`Error updating profile (${key}):`, err)

			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				`Failed to update ${key}.`

			antd.message.error(errorMessage)

			return false
		} finally {
			setLoading(false)
		}
	}

	React.useEffect(() => {
		if (profile_id) {
			fetchProfileData(profile_id)
		} else {
			setProfile(null)
			setError(null)
		}
	}, [profile_id])

	React.useEffect(() => {
		if (profile_id) {
			streamHealthIntervalRef.current = setInterval(
				fetchStreamHealth,
				1000,
			)
		}

		return () => {
			clearInterval(streamHealthIntervalRef.current)
		}
	}, [profile_id])

	if (fetching) {
		return <antd.Skeleton active style={{ padding: "20px" }} />
	}

	if (error) {
		return (
			<antd.Result
				status="warning"
				title="Error Loading Profile"
				subTitle={
					error.message ||
					"An unexpected error occurred. Please try again."
				}
				extra={[
					<antd.Button
						key="retry"
						type="primary"
						onClick={() => fetchProfileData(profile_id)}
					>
						Retry
					</antd.Button>,
				]}
			/>
		)
	}

	if (!profile) {
		return (
			<antd.Result
				status="info"
				title="No Profile Data"
				subTitle="The profile data could not be loaded, is not available, or no profile is selected."
			/>
		)
	}

	return (
		<div className="profile-view">
			<ProfileHeader profile={profile} streamHealth={streamHealth} />

			<antd.Segmented
				options={[
					{
						label: "Live",
						value: "live",
					},
					{
						label: "Configuration",
						value: "configuration",
					},
					{
						label: "Restreams",
						value: "restreams",
					},
					{
						label: "Media URLs",
						value: "media_urls",
					},
				]}
				onChange={(value) => setSelectedTab(value)}
				value={selectedTab}
			/>

			{KeyToComponent[selectedTab] &&
				React.createElement(KeyToComponent[selectedTab], {
					profile,
					loading,
					handleProfileUpdate,
					streamHealth,
				})}
		</div>
	)
}

export default ProfileData
