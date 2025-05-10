import React from "react"
import classnames from "classnames"

import Searcher from "@components/Searcher"
import { Icons } from "@components/Icons"

import SearchModel from "@models/search"
import MusicModel from "@models/music"
import RadioModel from "@models/radio"

import Navbar from "./components/Navbar"
import RecentlyPlayedList from "./components/RecentlyPlayedList"
import SearchResults from "./components/SearchResults"
import FeedItems from "./components/FeedItems"

import "./index.less"

const MusicExploreTab = (props) => {
	const [searchResults, setSearchResults] = React.useState(false)

	React.useEffect(() => {
		app.layout.page_panels.attachComponent("music_navbar", Navbar, {
			props: {
				setSearchResults: setSearchResults,
			},
		})

		return () => {
			if (app.layout.page_panels) {
				app.layout.page_panels.detachComponent("music_navbar")
			}
		}
	}, [])

	return (
		<div className={classnames("music-explore")}>
			{app.isMobile && (
				<Searcher
					useUrlQuery
					renderResults={false}
					model={(keywords, params) =>
						SearchModel.search("music", keywords, params)
					}
					onSearchResult={setSearchResults}
					onEmpty={() => setSearchResults(false)}
				/>
			)}

			{searchResults && <SearchResults data={searchResults} />}

			{!searchResults && <RecentlyPlayedList />}

			{!searchResults && (
				<div className="music-explore-content">
					<FeedItems
						type="tracks"
						headerTitle="All Tracks"
						headerIcon={<Icons.MdMusicNote />}
						fetchMethod={MusicModel.getAllTracks}
						itemsPerPage={6}
					/>

					<FeedItems
						type="playlists"
						headerTitle="All Releases"
						headerIcon={<Icons.MdNewspaper />}
						fetchMethod={MusicModel.getAllReleases}
					/>

					<FeedItems
						type="radios"
						headerTitle="Trending Radios"
						headerIcon={<Icons.FiRadio />}
						fetchMethod={RadioModel.getTrendings}
						disablePagination
					/>
				</div>
			)}
		</div>
	)
}

export default MusicExploreTab
