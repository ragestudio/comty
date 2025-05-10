import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { WithPlayerContext } from "@contexts/WithPlayerContext"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import checkUserIdIsSelf from "@utils/checkUserIdIsSelf"

import MusicModel from "@models/music"

import PlaylistHeader from "./header"
import TrackList from "./list"

import "./index.less"

const PlaylistView = ({
	playlist: initialPlaylist,
	noHeader = false,
	onLoadMore,
	hasMore,
}) => {
	const [playlist, setPlaylist] = React.useState(initialPlaylist)
	const [searchResults, setSearchResults] = React.useState(null)
	const searchTimeoutRef = React.useRef(null) // Ref for debounce timeout

	// Derive ownership directly instead of using state
	const isOwner = React.useMemo(
		() => checkUserIdIsSelf(playlist?.user_id),
		[playlist],
	)

	const playlistContextValue = React.useMemo(
		() => ({
			playlist_data: playlist,
			owning_playlist: isOwner,
			add_track: (track) => {
				/* TODO: Implement */
			},
			remove_track: (track) => {
				/* TODO: Implement */
			},
		}),
		[playlist, isOwner],
	)

	// Define handlers for playlist actions (Edit, Delete)
	const MoreMenuHandlers = React.useMemo(
		() => ({
			edit: async (pl) => {
				// TODO: Implement Edit Playlist logic
				console.log("Edit playlist:", pl._id)
				app.message.info("Edit not implemented yet.")
			},
			delete: async (pl) => {
				antd.Modal.confirm({
					title: "Are you sure you want to delete this playlist?",
					content: `Playlist: ${pl.title}`,
					okText: "Delete",
					okType: "danger",
					cancelText: "Cancel",
					onOk: async () => {
						try {
							await MusicModel.deletePlaylist(pl._id)
							app.message.success("Playlist deleted successfully")
							app.navigation.goToMusic() // Navigate away after deletion
						} catch (err) {
							console.error("Failed to delete playlist:", err)
							app.message.error(
								err.message || "Failed to delete playlist",
							)
						}
					},
				})
			},
		}),
		[],
	)

	const makeSearch = (value) => {
		// TODO: Implement API call for search
		console.log("Searching for:", value)
		setSearchResults([]) // Placeholder: clear results or set loading state
		return app.message.info("Search not implemented yet...")
	}

	const handleSearchChange = (value) => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}
		searchTimeoutRef.current = setTimeout(() => {
			makeSearch(value)
		}, 500) // 500ms debounce
	}

	const handleSearchEmpty = () => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}
		setSearchResults(null) // Clear search results when input is cleared
	}

	const handlePlayAll = () => {
		if (playlist?.items?.length > 0) {
			app.cores.player.start(playlist.items)
		}
	}

	const handleViewDetails = () => {
		if (playlist?.description) {
			app.layout.modal.open(
				"playlist_info",
				() => (
					<PlaylistInfoModalContent
						description={playlist.description}
					/>
				),
				{ title: playlist.title || "Playlist Info" }, // Add title to modal
			)
		}
	}

	const handleTrackClick = (track) => {
		const index = playlist.items.findIndex((item) => item._id === track._id)

		// Track not found in current playlist items
		if (index === -1) {
			return false
		}

		const playerCore = app.cores.player
		// Toggle playback if the clicked track is already playing
		if (playerCore.state.track_manifest?._id === track._id) {
			playerCore.playback.toggle()
		} else {
			// Start playback from the clicked track
			playerCore.start(playlist.items, { startIndex: index })
		}
	}

	const handleTrackStateChange = (track_id, update) => {
		setPlaylist((prev) => {
			if (!prev) return prev
			const trackIndex = prev.items.findIndex(
				(item) => item._id === track_id,
			)

			if (trackIndex !== -1) {
				const updatedItems = [...prev.items]
				updatedItems[trackIndex] = {
					...updatedItems[trackIndex],
					...update,
				}
				return { ...prev, items: updatedItems }
			}
			return prev
		})
	}

	const handleMoreMenuClick = async (e) => {
		const handler = MoreMenuHandlers[e.key]
		if (typeof handler === "function") {
			await handler(playlist)
		} else {
			console.error(`Invalid menu handler key: ${e.key}`)
		}
	}

	React.useEffect(() => {
		setPlaylist(initialPlaylist)
		setSearchResults(null)
	}, [initialPlaylist])

	React.useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [])

	if (!playlist) {
		return <antd.Skeleton active />
	}

	return (
		<PlaylistContext.Provider value={playlistContextValue}>
			<WithPlayerContext>
				<div className={classnames("playlist_view")}>
					{!noHeader && (
						<PlaylistHeader
							playlist={playlist}
							owningPlaylist={isOwner}
							onPlayAll={handlePlayAll}
							onViewDetails={handleViewDetails}
							onMoreMenuClick={handleMoreMenuClick}
						/>
					)}

					<TrackList
						tracks={playlist.items || []}
						searchResults={searchResults}
						onTrackClick={handleTrackClick}
						onTrackStateChange={handleTrackStateChange}
						onSearchChange={handleSearchChange}
						onSearchEmpty={handleSearchEmpty}
						onLoadMore={onLoadMore}
						hasMore={hasMore}
						noHeader={noHeader}
					/>
				</div>
			</WithPlayerContext>
		</PlaylistContext.Provider>
	)
}

export default PlaylistView
