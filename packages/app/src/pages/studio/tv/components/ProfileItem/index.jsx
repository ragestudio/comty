import React from "react"
import * as antd from "antd"

import "./index.less"

const Profile = ({
	profile,
	onClickManage,
	onClickChangeId,
	onClickDelete,
}) => {
	if (!profile) {
		return null
	}

	return (
		<div className="tvstudio-page-list-item">
			<div className="tvstudio-page-list-item__id">
				<antd.Tag>{profile._id}</antd.Tag>
			</div>

			<div
				className="tvstudio-page-list-item__thumbnail"
				style={{
					backgroundImage: `url("${profile.info.offline_thumbnail}")`,
				}}
				onClick={onClickManage}
			/>

			<div className="tvstudio-page-list-item__content">
				<div className="tvstudio-page-list-item__content__title">
					<h1>{profile.info.title}</h1>
				</div>

				<div className="tvstudio-page-list-item__content__description">
					<span>{profile.info.description ?? "No description"}</span>
				</div>

				<div className="tvstudio-page-list-item__content__actions">
					<antd.Button size="small" onClick={onClickManage}>
						Manage
					</antd.Button>
					<antd.Button
						size="small"
						type="danger"
						onClick={onClickDelete}
					>
						Delete
					</antd.Button>
				</div>
			</div>
		</div>
	)
}

export default Profile
