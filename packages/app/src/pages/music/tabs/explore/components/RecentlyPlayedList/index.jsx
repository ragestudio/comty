import React from "react"
import * as antd from "antd"

import Image from "@components/Image"
import { Icons } from "@components/Icons"
import MusicModel from "@models/music"

import "./index.less"

const RecentlyPlayedItem = (props) => {
	const { track } = props

	return (
		<div
			className="recently_played-item"
			onClick={() => app.cores.player.start(track._id)}
		>
			<div className="recently_played-item-icon">
				<Icons.FiPlay />
			</div>

			<div className="recently_played-item-cover">
				<Image src={track.cover} />
			</div>

			<div className="recently_played-item-content">
				<h3>{track.title}</h3>
			</div>
		</div>
	)
}

const RecentlyPlayedList = (props) => {
	const [L_Tracks, R_Tracks, E_Tracks, M_Tracks] = app.cores.api.useRequest(
		MusicModel.getRecentyPlayed,
		{
			limit: 6,
		},
	)

	if (E_Tracks) {
		return null
	}

	return (
		<div className="recently_played">
			<div className="recently_played-header">
				<h1>
					<Icons.MdHistory /> Recently played
				</h1>
			</div>

			<div className="recently_played-content">
				{L_Tracks && <antd.Skeleton active />}

				{R_Tracks && R_Tracks.lenght === 0 && <antd.Skeleton active />}

				{!L_Tracks && (
					<div className="recently_played-content-items">
						{R_Tracks.map((track, index) => {
							return (
								<RecentlyPlayedItem key={index} track={track} />
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default RecentlyPlayedList
