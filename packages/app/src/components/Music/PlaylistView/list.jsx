import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { WithPlayerContext } from "@contexts/WithPlayerContext"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import LoadMore from "@components/LoadMore"
import { Icons } from "@components/Icons"
import MusicTrack from "@components/Music/Track"
import SearchButton from "@components/SearchButton"

/**
 * Renders the list of tracks in the playlist.
 */
const TrackList = ({
	tracks,
	searchResults,
	onTrackClick,
	onTrackStateChange,
	onSearchChange,
	onSearchEmpty,
	onLoadMore,
	hasMore,
	noHeader = false,
}) => {
	const showListHeader = !noHeader && (tracks.length > 0 || searchResults)

	if (!searchResults && tracks.length === 0) {
		return (
			<div className="list">
				<antd.Empty
					description={
						<>
							<Icons.MdLibraryMusic /> This playlist is empty!
						</>
					}
				/>
			</div>
		)
	}

	return (
		<div className="list">
			{showListHeader && (
				<div className="list_header">
					<h1>
						<Icons.MdPlaylistPlay /> Tracks
					</h1>
					{/* TODO: Implement Search API call */}
					<SearchButton
						onChange={onSearchChange}
						onEmpty={onSearchEmpty}
						disabled // Keep disabled until implemented
					/>
				</div>
			)}

			{searchResults ? ( // Display search results if available
				searchResults.map((item) => (
					<MusicTrack
						key={item._id}
						order={item._id} // Consider using index if order matters
						track={item}
						onPlay={() => onTrackClick(item)}
						changeState={(update) =>
							onTrackStateChange(item._id, update)
						}
					/>
				))
			) : (
				// Display regular track list
				<LoadMore
					className="list_content"
					loadingComponent={() => <antd.Skeleton />}
					onBottom={onLoadMore}
					hasMore={hasMore}
				>
					<WithPlayerContext>
						{tracks.map((item, index) => (
							<MusicTrack
								key={item._id} // Use unique ID for key
								order={index + 1}
								track={item}
								onPlay={() => onTrackClick(item)}
								changeState={(update) =>
									onTrackStateChange(item._id, update)
								}
							/>
						))}
					</WithPlayerContext>
				</LoadMore>
			)}
		</div>
	)
}

export default TrackList
