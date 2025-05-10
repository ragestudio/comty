import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import ImageViewer from "@components/ImageViewer"
import LikeButton from "@components/LikeButton"
import seekToTimeLabel from "@utils/seekToTimeLabel"

import MusicModel from "@models/music"

import PlaylistTypeDecorators from "./decorators"

const typeToKind = {
	album: "releases",
	ep: "releases",
	compilation: "releases",
	playlist: "playlists",
}

const PlaylistHeader = ({
	playlist,
	owningPlaylist,
	onPlayAll,
	onViewDetails,
	onMoreMenuClick,
}) => {
	const playlistType = playlist.type?.toLowerCase() ?? "playlist"

	const moreMenuItems = React.useMemo(() => {
		const items = []
		// Only allow editing/deleting standard playlists owned by the user
		if (
			owningPlaylist &&
			(!playlist.type || playlist.type === "playlist")
		) {
			items.push({ key: "edit", label: "Edit" })
			items.push({ key: "delete", label: "Delete" })
		}
		return items
	}, [playlist.type, owningPlaylist])

	const handlePublisherClick = () => {
		if (playlist.publisher?.username) {
			app.navigation.goToAccount(playlist.publisher.username)
		}
	}

	const handleOnClickLike = async (to) => {
		await MusicModel.toggleItemFavorite(
			typeToKind[playlistType],
			playlist._id,
			to,
		)
	}

	const fetchItemIsFavorite = async () => {
		const isFavorite = await MusicModel.isItemFavorited(
			typeToKind[playlistType],
			playlist._id,
		)
		return isFavorite
	}

	return (
		<div className="play_info_wrapper">
			<div className="play_info">
				<div className="play_info_cover">
					<ImageViewer
						src={
							playlist.cover ??
							playlist.thumbnail ??
							"/assets/no_song.png"
						}
					/>
				</div>

				<div className="play_info_details">
					<div className="play_info_title">
						{playlist.service === "tidal" && <Icons.SiTidal />}{" "}
						{typeof playlist.title === "function" ? (
							playlist.title()
						) : (
							<h1>{playlist.title}</h1>
						)}
					</div>

					<div className="play_info_statistics">
						{PlaylistTypeDecorators[playlistType] && (
							<div className="play_info_statistics_item">
								{PlaylistTypeDecorators[playlistType]()}
							</div>
						)}

						<div className="play_info_statistics_item">
							<p>
								<Icons.MdLibraryMusic /> {playlist.total_items}{" "}
								Items
							</p>
						</div>

						{playlist.total_duration > 0 && (
							<div className="play_info_statistics_item">
								<p>
									<Icons.IoMdTime />{" "}
									{seekToTimeLabel(playlist.total_duration)}
								</p>
							</div>
						)}

						{playlist.publisher && (
							<div className="play_info_statistics_item">
								<p onClick={handlePublisherClick}>
									<Icons.MdPerson /> Publised by{" "}
									<a>{playlist.publisher.username}</a>
								</p>
							</div>
						)}
					</div>

					<div className="play_info_actions">
						<antd.Button
							type="primary"
							shape="rounded"
							size="large"
							onClick={onPlayAll}
							disabled={playlist.items.length === 0}
						>
							<Icons.MdPlayArrow /> Play
						</antd.Button>

						<div className="likeButtonWrapper">
							<LikeButton
								liked={fetchItemIsFavorite}
								onClick={handleOnClickLike}
							/>
						</div>

						{moreMenuItems.length > 0 && (
							<antd.Dropdown
								trigger={["click"]}
								placement="bottom"
								menu={{
									items: moreMenuItems,
									onClick: onMoreMenuClick,
								}}
							>
								<antd.Button icon={<Icons.MdMoreVert />} />
							</antd.Dropdown>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default PlaylistHeader
