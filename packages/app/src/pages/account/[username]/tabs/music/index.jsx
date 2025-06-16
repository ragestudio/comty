import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import Playlist from "@components/Music/Playlist"

import MusicModel from "@models/music"

import "./index.less"

export default (props) => {
	const user_id = props.state.user._id

	const [L_Releases, R_Releases, E_Releases, M_Releases] =
		app.cores.api.useRequest(MusicModel.getAllReleases, {
			user_id: user_id,
		})

	if (E_Releases) {
		return (
			<antd.Result
				status="warning"
				title="Failed to retrieve releases"
				subTitle={E_Releases.message}
			/>
		)
	}

	if (L_Releases) {
		return <antd.Skeleton active />
	}

	const isEmpty = R_Releases.items.length === 0

	return (
		<div
			className={classnames("profile_releases", {
				["empty"]: isEmpty,
			})}
		>
			{isEmpty && (
				<antd.Result
					status="warning"
					title="This user has no releases yet."
				/>
			)}
			{R_Releases.items.map((r) => {
				return <Playlist key={r._id} playlist={r} />
			})}
		</div>
	)
}
