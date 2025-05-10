import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import TracksLibraryView from "./views/tracks"
import ReleasesLibraryView from "./views/releases"
import PlaylistLibraryView from "./views/playlists"

import "./index.less"

const Views = {
	tracks: {
		value: "tracks",
		label: "Tracks",
		icon: <Icons.MdMusicNote />,
		element: TracksLibraryView,
	},
	releases: {
		value: "releases",
		label: "Releases",
		icon: <Icons.MdAlbum />,
		element: ReleasesLibraryView,
	},
	playlists: {
		value: "playlists",
		label: "Playlists",
		icon: <Icons.MdPlaylistPlay />,
		element: PlaylistLibraryView,
		disabled: true,
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
					options={Object.values(Views)}
				/>
			</div>

			{selectedTab &&
				Views[selectedTab] &&
				React.createElement(Views[selectedTab].element)}
		</div>
	)
}

export default Library
