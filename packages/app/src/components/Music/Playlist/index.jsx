import React from "react"
import classnames from "classnames"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import "./index.less"

const Playlist = (props) => {
	const [coverHover, setCoverHover] = React.useState(false)

	let { playlist } = props

	if (!playlist) {
		return null
	}

	const onClick = () => {
		if (typeof props.onClick === "function") {
			return props.onClick(playlist)
		}

		const params = new URLSearchParams()

		if (playlist.type) {
			params.set("type", playlist.type)
		}

		if (playlist.service) {
			params.set("service", playlist.service)
		}

		return app.location.push(
			`/music/list/${playlist._id}?${params.toString()}`,
		)
	}

	const onClickPlay = (e) => {
		e.stopPropagation()

		if (playlist.items) {
			app.cores.player.start(playlist.items)
		}
	}

	return (
		<div
			id={playlist._id}
			className={classnames("playlist", {
				"cover-hovering": coverHover,
				"row-mode": props.row === true,
			})}
		>
			<div
				className="playlist_cover"
				onMouseEnter={() => setCoverHover(true)}
				onMouseLeave={() => setCoverHover(false)}
				onClick={onClickPlay}
			>
				<div className="playlist_cover_mask">
					<Icons.Play />
				</div>

				<Image
					src={
						playlist.cover ??
						playlist.thumbnail ??
						"/assets/no_song.png"
					}
				/>
			</div>

			<div className="playlist_info">
				<div
					className="playlist_info_title"
					onClick={onClick}
				>
					<h1>{playlist.title}</h1>
				</div>

				{props.row && (
					<div className="playlist_details">
						{playlist.service === "tidal" && (
							<p>
								<Icons.SiTidal />
								Tidal
							</p>
						)}

						<p>
							<Icons.Music2 />
							{playlist.type ?? "playlist"}
						</p>
					</div>
				)}
			</div>

			{!props.row && (
				<div className="playlist_details">
					{props.length && (
						<p>
							<Icons.SquareLibrary />{" "}
							{props.length ??
								playlist.total_length ??
								playlist.list.length}
						</p>
					)}

					{playlist.type && (
						<p>
							<Icons.ListMusic />
							{playlist.type ?? "playlist"}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

export default Playlist
