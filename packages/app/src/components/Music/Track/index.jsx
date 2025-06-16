import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import RGBStringToValues from "@utils/rgbToValues"

import ImageViewer from "@components/ImageViewer"
import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import "./index.less"

function secondsToIsoTime(seconds) {
	const minutes = Math.floor(seconds / 60)

	return `${minutes}:${Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0")}`
}

const handlers = {
	like: async (ctx, track) => {
		await MusicModel.toggleItemFavourite("track", track._id, true)

		ctx.changeState({
			liked: true,
		})
		ctx.closeMenu()
	},
	unlike: async (ctx, track) => {
		await MusicModel.toggleItemFavourite("track", track._id, false)

		ctx.changeState({
			liked: false,
		})
		ctx.closeMenu()
	},
	add_to_playlist: async (ctx, track) => {},
	add_to_queue: async (ctx, track) => {
		await app.cores.player.queue.add(track)
	},
	play_next: async (ctx, track) => {
		await app.cores.player.queue.add(track, { next: true })
	},
}

const Track = (props) => {
	const [{ loading, track_manifest, playback_status }] =
		usePlayerStateContext()

	const playlist_ctx = React.useContext(PlaylistContext)

	const [moreMenuOpened, setMoreMenuOpened] = React.useState(false)

	const isCurrent = track_manifest?._id === props.track._id
	const isPlaying = isCurrent && playback_status === "playing"

	const handleClickPlayBtn = () => {
		if (typeof props.onPlay === "function") {
			return props.onPlay(props.track)
		}

		if (typeof props.onClickPlayBtn === "function") {
			props.onClickPlayBtn(props.track)
		}

		if (!isCurrent) {
			app.cores.player.start(props.track)
		} else {
			app.cores.player.playback.toggle()
		}
	}

	const handleOnClickItem = React.useCallback(() => {
		if (props.onClick) {
			props.onClick(props.track)
		}

		if (app.isMobile) {
			handleClickPlayBtn()
		}
	}, [])

	const handleMoreMenuOpen = React.useCallback(() => {
		if (app.isMobile) {
			return
		}

		return setMoreMenuOpened((prev) => {
			return !prev
		})
	}, [])

	const handleMoreMenuItemClick = React.useCallback((e) => {
		const { key } = e

		if (typeof handlers[key] === "function") {
			return handlers[key](
				{
					closeMenu: () => {
						setMoreMenuOpened(false)
					},
					changeState: props.changeState,
				},
				props.track,
			)
		}
	}, [])

	const moreMenuItems = React.useMemo(() => {
		const items = [
			{
				key: "like",
				icon: <Icons.MdFavorite />,
				label: "Like",
			},
			{
				key: "share",
				icon: <Icons.MdShare />,
				label: "Share",
				disabled: true,
			},
			{
				key: "add_to_playlist",
				icon: <Icons.MdPlaylistAdd />,
				label: "Add to playlist",
				disabled: true,
			},
			{
				type: "divider",
			},
			{
				key: "add_to_queue",
				icon: <Icons.MdQueueMusic />,
				label: "Add to queue",
			},
			{
				key: "play_next",
				icon: <Icons.MdSkipNext />,
				label: "Play next",
			},
		]

		if (props.track.liked) {
			items[0] = {
				key: "unlike",
				icon: <Icons.MdFavorite />,
				label: "Unlike",
			}
		}

		if (playlist_ctx) {
			if (playlist_ctx.owning_playlist) {
				items.push({
					type: "divider",
				})

				items.push({
					key: "remove_from_playlist",
					icon: <Icons.MdPlaylistRemove />,
					label: "Remove from playlist",
				})
			}
		}

		return items
	}, [props.track])

	const trackDuration =
		props.track?.metadata?.duration ?? props.track?.duration

	return (
		<div
			id={props.track._id}
			className={classnames("music-track", {
				["current"]: isCurrent,
				["playing"]: isPlaying,
				["loading"]: isCurrent && loading,
			})}
			style={{
				"--cover_average-color": RGBStringToValues(
					track_manifest?.cover_analysis?.rgb,
				),
			}}
		>
			<div className="music-track_background" />

			<div className="music-track_content">
				{!app.isMobile && (
					<div
						className={classnames("music-track_play", {
							["withOrder"]: props.order !== undefined,
						})}
					>
						<span className="music-track_orderIndex">
							{props.order}
						</span>

						<antd.Button
							type="primary"
							shape="circle"
							icon={
								isPlaying ? (
									<Icons.MdPause />
								) : (
									<Icons.MdPlayArrow />
								)
							}
							onClick={handleClickPlayBtn}
						/>

						{/* {props.track?.metadata?.duration && (
							<div className="music-track_play_duration">
								{secondsToIsoTime(
									props.track.metadata.duration,
								)}
							</div>
						)} */}
					</div>
				)}

				<div className="music-track_cover" onClick={handleOnClickItem}>
					<ImageViewer
						src={props.track.cover ?? props.track.thumbnail}
					/>
				</div>

				<div
					className="music-track_details"
					onClick={handleOnClickItem}
				>
					<div className="music-track_titles">
						<span className="music-track_title">
							{props.track.service === "tidal" && (
								<Icons.SiTidal />
							)}
							{props.track.title}
						</span>

						{props.track.version && (
							<span className="music-track_version">
								({props.track.version})
							</span>
						)}
					</div>
					<div className="music-track_artist">
						<span>
							{Array.isArray(props.track.artists)
								? props.track.artists.join(", ")
								: props.track.artist}
						</span>
					</div>
				</div>
			</div>

			<div className="music-track_actions">
				{trackDuration && (
					<div className="music-track_play_duration">
						<Icons.FiClock />
						{secondsToIsoTime(trackDuration)}
					</div>
				)}

				<antd.Dropdown
					menu={{
						items: moreMenuItems,
						onClick: handleMoreMenuItemClick,
					}}
					onOpenChange={handleMoreMenuOpen}
					open={moreMenuOpened}
					trigger={["click"]}
				>
					<div className="music-track_more-menu">
						<Icons.IoMdMore />
					</div>
				</antd.Dropdown>
			</div>
		</div>
	)
}

export default Track
