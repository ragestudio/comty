import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import TracksLibraryView from "./views/tracks"
import PlaylistLibraryView from "./views/playlists"

import "./index.less"

const TabToView = {
	tracks: TracksLibraryView,
	playlist: PlaylistLibraryView,
	releases: PlaylistLibraryView,
}

const TabToHeader = {
	tracks: {
		icon: <Icons.MdMusicNote />,
		label: "Tracks",
	},
	playlist: {
		icon: <Icons.MdPlaylistPlay />,
		label: "Playlists",
	},
}

const Library = (props) => {
	const [selectedTab, setSelectedTab] = React.useState("tracks")

	return (
		<div className="music-library">
			<div className="music-library_header">
				<antd.Segmented
					value={selectedTab}
					onChange={setSelectedTab}
					options={[
						{
							value: "tracks",
							label: "Tracks",
							icon: <Icons.MdMusicNote />,
						},
						{
							value: "playlist",
							label: "Playlists",
							icon: <Icons.MdPlaylistPlay />,
						},
						{
							value: "releases",
							label: "Releases",
							icon: <Icons.MdPlaylistPlay />,
						},
					]}
				/>
			</div>

			{selectedTab &&
				TabToView[selectedTab] &&
				React.createElement(TabToView[selectedTab])}
		</div>
	)
}

export default Library
