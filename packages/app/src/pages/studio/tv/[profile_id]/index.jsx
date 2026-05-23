import React from "react"
import * as antd from "antd"

import { RTEngineClient } from "linebridge-client"
import StreamingModel from "@models/spectrum"
import SessionModel from "@models/session"

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

const useStreamWebsocket = ({ stream_id, statsInterval = 1000 } = {}) => {
	if (!stream_id) {
		console.error("stream_id is required")
		return { client: null, data: {} }
	}

	const [data, setData] = React.useState({})
	const statsIntervalRef = React.useRef(null)
	const available = React.useRef(false)

	const client = React.useMemo(
		() =>
			new RTEngineClient({
				url: `${StreamingModel.baseUrl}/stream/${stream_id}/ws`,
				token: SessionModel.token,
			}),
		[],
	)

	const handleOnUpdate = (update_data) => {
		setData({ ...update_data })
	}

	const handleStatsTick = async () => {
		if (!client) {
			return false
		}

		if (!client.state.connected) {
			return false
		}

		if (!available.current) {
			return false
		}

		const stats = await client.call("get:stats")

		setData((prevData) => ({ ...prevData, ...stats }))

		console.debug("stream stats tick", stats)
	}

	React.useEffect(() => {
		available.current = data?.available
	}, [data])

	React.useEffect(() => {
		statsIntervalRef.current = setInterval(handleStatsTick, statsInterval)

		client.on("update", handleOnUpdate)
		client.connect()

		return () => {
			if (statsIntervalRef.current) {
				clearInterval(statsIntervalRef.current)
			}

			client.off("update", handleOnUpdate)
			client.destroy()
		}
	}, [])

	return { client, data }
}

const ProfileData = (props) => {
	const { profile_id } = props.params

	if (!profile_id) {
		return null
	}

	useCenteredContainer(false)

	const { client, data } = useStreamWebsocket({ stream_id: profile_id })

	const [initialLoading, setInitialLoading] = React.useState(true)
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState(null)
	const [selectedTab, setSelectedTab] = React.useState("live")

	const [profile, setProfile] = React.useState(null)

	async function fetchProfileData(idToFetch) {
		try {
			setError(null)
			setLoading(true)

			const result = await StreamingModel.getProfile(idToFetch)

			if (result) {
				if (!Array.isArray(result.restreams)) {
					result.restreams = []
				}

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
			setLoading(false)
			setInitialLoading(false)
		}
	}

	async function handleProfileUpdate(key, value) {
		if (!profile || !profile._id) {
			antd.message.error("Profile data is not available for update.")
			return false
		}

		try {
			await StreamingModel.updateProfile(profile._id, {
				[key]: value,
			})
			await fetchProfileData(profile_id)

			app.message.success("Change applied")
		} catch (err) {
			console.error(`Error updating profile (${key}):`, err)

			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				`Failed to update ${key}.`

			app.message.error(errorMessage)

			return false
		}
	}

	React.useEffect(() => {
		fetchProfileData(profile_id)
	}, [data.available])

	React.useEffect(() => {
		if (profile_id) {
			fetchProfileData(profile_id)
		} else {
			setProfile(null)
			setError(null)
		}
	}, [profile_id])

	if (initialLoading) {
		return (
			<antd.Skeleton
				active
				style={{ padding: "20px" }}
			/>
		)
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
			<ProfileHeader
				profile={profile}
				streamHealth={data}
			/>

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
					loading: loading,
					handleProfileUpdate,
					streamHealth: data,
				})}
		</div>
	)
}

export default ProfileData
