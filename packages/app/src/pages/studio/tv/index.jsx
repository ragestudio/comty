import React from "react"
import * as antd from "antd"

import Skeleton from "@components/Skeleton"

import ProfileCreator from "./components/ProfileCreator"
import ProfileItem from "./components/ProfileItem"

import Streaming from "@models/spectrum"

import "./index.less"

const TVStudioPage = (props) => {
	const [loading, list, error, repeat] = app.cores.api.useRequest(
		Streaming.getOwnProfiles,
	)

	function handleNewProfileClick() {
		app.layout.modal.open("tv_profile_creator", ProfileCreator, {
			props: {
				onCreate: (id, data) => {
					repeat()
				},
			},
		})
	}

	function handleDeleteProfileClick(id) {
		app.layout.modal.confirm({
			headerText: "Delete profile",
			descriptionText: "Are you sure you want to delete profile?",
			onConfirm: async () => {
				const result = await Streaming.deleteProfile(id)

				if (result) {
					app.message.success("Profile deleted")
					repeat()
				}
			},
		})
	}

	function handleManageProfileClick(id) {
		app.location.push(`/studio/tv/${id}`)
	}

	if (error) {
		return (
			<antd.Result
				status="warning"
				title="Error"
				subTitle="Failed to fetch profiles"
			/>
		)
	}

	if (loading) {
		return <Skeleton />
	}

	return (
		<div className="tvstudio-page">
			<div className="tvstudio-page-header">
				<h1>TV Studio</h1>
			</div>

			<div className="tvstudio-page-actions">
				<antd.Button type="primary" onClick={handleNewProfileClick}>
					Create new
				</antd.Button>
			</div>

			<div className="tvstudio-page-list">
				{list.length > 0 &&
					list.map((profile, index) => {
						return (
							<ProfileItem
								key={index}
								profile={profile}
								onClickManage={() =>
									handleManageProfileClick(profile._id)
								}
								onClickDelete={() =>
									handleDeleteProfileClick(profile._id)
								}
							/>
						)
					})}
			</div>
		</div>
	)
}

export default TVStudioPage
