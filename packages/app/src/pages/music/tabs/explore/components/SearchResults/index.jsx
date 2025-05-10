import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import { createIconRender } from "@components/Icons"
import MusicTrack from "@components/Music/Track"
import Playlist from "@components/Music/Playlist"

const ResultGroupsDecorators = {
	playlists: {
		icon: "MdPlaylistPlay",
		label: "Playlists",
		renderItem: (props) => {
			return <Playlist key={props.key} playlist={props.item} />
		},
	},
	tracks: {
		icon: "MdMusicNote",
		label: "Tracks",
		renderItem: (props) => {
			return (
				<MusicTrack
					key={props.key}
					track={props.item}
					//onClickPlayBtn={() => app.cores.player.start(props.item)}
					onClick={() => app.location.push(`/play/${props.item._id}`)}
				/>
			)
		},
	},
}

const SearchResults = ({ data }) => {
	if (typeof data !== "object") {
		return null
	}

	let groupsKeys = Object.keys(data)

	// filter out groups with no items array property
	groupsKeys = groupsKeys.filter((key) => {
		if (!Array.isArray(data[key].items)) {
			return false
		}

		return true
	})

	// filter out groups with empty items array
	groupsKeys = groupsKeys.filter((key) => {
		return data[key].items.length > 0
	})

	if (groupsKeys.length === 0) {
		return (
			<div className="music-explorer_search_results no_results">
				<antd.Result
					status="info"
					title="No results"
					subTitle="We are sorry, but we could not find any results for your search."
				/>
			</div>
		)
	}

	return (
		<div
			className={classnames("music-explorer_search_results", {
				["one_column"]: groupsKeys.length === 1,
			})}
		>
			{groupsKeys.map((key, index) => {
				const decorator = ResultGroupsDecorators[key] ?? {
					icon: null,
					label: key,
					renderItem: () => null,
				}

				return (
					<div
						className="music-explorer_search_results_group"
						key={index}
					>
						<div className="music-explorer_search_results_group_header">
							<h1>
								{createIconRender(decorator.icon)}
								<Translation>
									{(t) => t(decorator.label)}
								</Translation>
							</h1>
						</div>

						<div className="music-explorer_search_results_group_list">
							{data[key].items.map((item, index) => {
								return decorator.renderItem({
									key: index,
									item,
								})
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default SearchResults
