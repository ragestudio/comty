import React from "react"

import Searcher from "@components/Searcher"
import SearchModel from "@models/search"

const MusicNavbar = (props) => {
	return (
		<div className="music_navbar">
			<Searcher
				useUrlQuery
				renderResults={false}
				model={async (keywords, params) =>
					SearchModel.search(keywords, params, ["tracks"])
				}
				onSearchResult={props.setSearchResults}
				onEmpty={() => props.setSearchResults(false)}
			/>
		</div>
	)
}

export default MusicNavbar
