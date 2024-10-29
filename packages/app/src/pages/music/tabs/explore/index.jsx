import React from "react"
import classnames from "classnames"

import Searcher from "@components/Searcher"
import { Icons } from "@components/Icons"

import FeedModel from "@models/feed"
import MusicModel from "@models/music"

import Navbar from "./components/Navbar"
import RecentlyPlayedList from "./components/RecentlyPlayedList"
import SearchResults from "./components/SearchResults"
import ReleasesList from "./components/ReleasesList"
import FeaturedPlaylist from "./components/FeaturedPlaylist"

import "./index.less"

 const MusicExploreTab = (props) => {
    const [searchResults, setSearchResults] = React.useState(false)

    React.useEffect(() => {
        app.layout.toggleCenteredContent(true)

        app.layout.page_panels.attachComponent("music_navbar", Navbar, {
            props: {
                setSearchResults: setSearchResults,
            }
        })

        return () => {
            if (app.layout.page_panels) {
                app.layout.page_panels.detachComponent("music_navbar")
            }
        }
    }, [])

    return <div
        className={classnames(
            "musicExplorer",
        )}
    >
        {
            app.isMobile && <Searcher
                useUrlQuery
                renderResults={false}
                model={MusicModel.search}
                onSearchResult={setSearchResults}
                onEmpty={() => setSearchResults(false)}
            />
        }

        {
            searchResults && <SearchResults
                data={searchResults}
            />
        }

        {
            !searchResults && <div className="feed_main">
                <FeaturedPlaylist />

                <RecentlyPlayedList />

                <ReleasesList
                    headerTitle="From your following artists"
                    headerIcon={<Icons.MdPerson />}
                    fetchMethod={FeedModel.getMusicFeed}
                />

                <ReleasesList
                    headerTitle="Explore from global"
                    headerIcon={<Icons.MdExplore />}
                    fetchMethod={FeedModel.getGlobalMusicFeed}
                />
            </div>
        }
    </div>
}

export default MusicExploreTab