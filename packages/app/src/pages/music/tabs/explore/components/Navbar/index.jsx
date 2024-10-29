import React from "react"

import Searcher from "@components/Searcher"
import MusicModel from "@models/music"

const MusicNavbar = (props) => {
    return <div className="music_navbar">
        <Searcher
            useUrlQuery
            renderResults={false}
            model={MusicModel.search}
            onSearchResult={props.setSearchResults}
            onEmpty={() => props.setSearchResults(false)}
        />
    </div>
}

export default MusicNavbar