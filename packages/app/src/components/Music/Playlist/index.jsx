import React from "react"
import classnames from "classnames"

import { ImageViewer } from "@components"
import { Icons } from "@components/Icons"

import "./index.less"

const typeToNavigationType = {
	playlist: "playlist",
	album: "album",
	track: "track",
	single: "track",
	ep: "album",
}

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

		return app.location.push(`/music/list/${playlist._id}`)
	}

	const onClickPlay = (e) => {
		e.stopPropagation()

		app.cores.player.start(playlist.items)
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
					<Icons.FiPlay />
				</div>

				<ImageViewer
					src={
						playlist.cover ??
						playlist.thumbnail ??
						"/assets/no_song.png"
					}
				/>
			</div>

			<div className="playlist_info">
				<div className="playlist_info_title" onClick={onClick}>
					<h1>{playlist.title}</h1>
				</div>
				{props.row && (
					<div className="playlist_details">
						<p>
							<Icons.MdAlbum />
							{playlist.type ?? "playlist"}
						</p>
					</div>
				)}
			</div>

			{!props.row && (
				<div className="playlist_details">
					{props.length && (
						<p>
							<Icons.MdLibraryMusic />{" "}
							{props.length ??
								playlist.total_length ??
								playlist.list.length}
						</p>
					)}

					{playlist.type && (
						<p>
							<Icons.MdAlbum />
							{playlist.type ?? "playlist"}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

export default Playlist
