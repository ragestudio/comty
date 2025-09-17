import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import MenuItemsBase from "./menuItems"
import MenuHandlers from "./menuHandlers"

import RGBStringToValues from "@utils/rgbToValues"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import "./index.less"

function secondsToIsoTime(seconds) {
	const minutes = Math.floor(seconds / 60)

	return `${minutes}:${Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0")}`
}

const Track = React.memo((props) => {
	const playlist_ctx = React.useContext(PlaylistContext)

	const [moreMenuOpened, setMoreMenuOpened] = React.useState(false)
	const [liked, setLiked] = React.useState(props.track.liked)

	const trackDuration = React.useMemo(() => {
		return props.track?.metadata?.duration ?? props.track?.duration
	}, [props.track])

	const menuItems = React.useMemo(() => {
		const items = [...MenuItemsBase]

		if (props.track.liked) {
			items[0] = {
				key: "unlike",
				icon: <Icons.HeartPlus />,
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
					icon: <Icons.ListX />,
					label: "Remove from playlist",
				})
			}
		}

		return items
	}, [props.track])

	const handleClickPlayBtn = React.useCallback(() => {
		if (typeof props.onPlay === "function") {
			return props.onPlay(props.track)
		}

		if (typeof props.onClickPlayBtn === "function") {
			props.onClickPlayBtn(props.track)
		}

		if (!props.isCurrent) {
			app.cores.player.start(props.track)
		} else {
			app.cores.player.playback.toggle()
		}
	}, [props.isCurrent])

	const handleOnClickItem = React.useCallback(() => {
		if (props.onClick) {
			props.onClick(props.track)
		}

		if (app.isMobile) {
			handleClickPlayBtn()
		}
	}, [props.track])

	const handleMoreMenuOpen = React.useCallback(() => {
		if (app.isMobile) {
			return
		}

		return setMoreMenuOpened((prev) => {
			return !prev
		})
	}, [])

	const handleMoreMenuItemClick = React.useCallback(
		(e) => {
			const { key } = e

			if (typeof MenuHandlers[key] === "function") {
				return MenuHandlers[key](
					{
						close: () => {
							setMoreMenuOpened(false)
						},
						setLiked: setLiked,
					},
					props.track,
				)
			}
		},
		[props.track],
	)

	return (
		<div
			id={props.track._id}
			className={classnames("music-track", {
				["current"]: props.isCurrent,
				["playing"]: props.isPlaying,
			})}
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
								props.isPlaying ? (
									<Icons.Pause />
								) : (
									<Icons.Play />
								)
							}
							onClick={handleClickPlayBtn}
						/>
					</div>
				)}

				<div
					className="music-track_cover"
					onClick={handleOnClickItem}
				>
					<Image src={props.track.cover ?? props.track.thumbnail} />
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
						<Icons.Clock />
						{secondsToIsoTime(trackDuration)}
					</div>
				)}

				<antd.Dropdown
					menu={{
						items: menuItems,
						onClick: handleMoreMenuItemClick,
					}}
					onOpenChange={handleMoreMenuOpen}
					open={moreMenuOpened}
					trigger={["click"]}
				>
					<div className="music-track_more-menu">
						<Icons.EllipsisVertical />
					</div>
				</antd.Dropdown>
			</div>
		</div>
	)
})

Track.displayName = "Track"

export default Track
