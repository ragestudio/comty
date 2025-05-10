import React from "react"
import * as antd from "antd"

import ProfileCreator from "./components/ProfileCreator"
import Skeleton from "@components/Skeleton"

import Streaming from "@models/spectrum"

import useCenteredContainer from "@hooks/useCenteredContainer"

import "./index.less"

const Profile = ({ profile, onClick }) => {
	return <div onClick={onClick}>{profile.profile_name}</div>
}

const TVStudioPage = (props) => {
	useCenteredContainer(false)

	const [loading, list, error, repeat] = app.cores.api.useRequest(
		Streaming.getOwnProfiles,
	)

	function handleNewProfileClick() {
		app.layout.modal.open("tv_profile_creator", ProfileCreator, {
			props: {
				onCreate: (id, data) => {
					setSelectedProfileId(id)
				},
			},
		})
	}

	function handleProfileClick(id) {
		app.location.push(`/studio/tv/${id}`)
	}

	if (loading) {
		return <Skeleton />
	}

	return (
		<div className="tvstudio-page">
			<div className="tvstudio-page-actions">
				<antd.Button type="primary" onClick={handleNewProfileClick}>
					Create new
				</antd.Button>
			</div>

			{list.length > 0 &&
				list.map((profile, index) => {
					return (
						<Profile
							key={index}
							profile={profile}
							onClick={() => handleProfileClick(profile._id)}
						/>
					)
				})}
		</div>
	)
}

export default TVStudioPage
