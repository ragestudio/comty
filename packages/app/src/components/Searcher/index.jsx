import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import lodash from "lodash"
import { Translation } from "react-i18next"
import { Icons, createIconRender } from "@components/Icons"

import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"

import UserPreview from "@components/UserPreview"
import MusicTrack from "@components/Music/Track"
import Playlist from "@components/Music/Playlist"

import SearchModel from "@models/search"

import "./index.less"

const ResultsTypeDecorators = {
	users: {
		icon: "Users",
		label: "Users",
		onClick: (item) => {
			app.navigation.goToAccount(item.username)
		},
		renderItem: (props) => {
			const { item, onClick } = props

			return (
				<div className="suggestion">
					<UserPreview
						onClick={() => onClick(item)}
						user={item}
					/>
				</div>
			)
		},
	},
	tracks: {
		icon: "LibraryBig",
		label: "Tracks",
		renderItem: (props) => {
			const { item, onClick } = props

			return (
				<div className="suggestion">
					<MusicTrack
						track={item}
						onClick={onClick}
					/>
				</div>
			)
		},
	},
	playlists: {
		icon: "ListMusic",
		label: "Playlists",
		renderItem: (props) => {
			return (
				<div className="suggestion">
					<Playlist playlist={props.item} />
				</div>
			)
		},
	},
}

const Results = (props) => {
	let { results } = props

	// console.log("results", results, typeof results)

	if (typeof results !== "object") {
		return null
	}

	let groupsKeys = Object.keys(results)

	// filter out groups with no items array property
	groupsKeys = groupsKeys.filter((key) => {
		if (!Array.isArray(results[key].items)) {
			return false
		}

		return true
	})

	// filter out groups with empty items array
	groupsKeys = groupsKeys.filter((key) => {
		return results[key].items.length > 0
	})

	const handleClick = async (decorator, data) => {
		if (typeof decorator.onClick === "function") {
			await decorator.onClick(data)
		}

		if (typeof props.onClose === "function") {
			return props.onClose()
		}
	}

	if (props.loading) {
		return (
			<div className="searcher_results">
				<antd.Skeleton active />
			</div>
		)
	}

	if (groupsKeys.length === 0) {
		return (
			<div className="searcher_results no_results">
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
			className={classnames("searcher_results", {
				["one_column"]: groupsKeys.length === 1,
			})}
		>
			{groupsKeys.map((key, index) => {
				const decorator = ResultsTypeDecorators[key] ?? {
					icon: null,
					label: key,
					renderItem: () => null,
				}

				return (
					<div
						className="searcher_results_category"
						key={index}
					>
						<div className="searcher_results_category_header">
							<h2>
								{createIconRender(decorator.icon)}
								<Translation>
									{(t) => t(decorator.label)}
								</Translation>
							</h2>
						</div>

						<div
							className="searcher_results_category_suggestions"
							id={key}
						>
							{results[key].items.map((item, index) => {
								return decorator.renderItem({
									key: index,
									item,
									onClick: (...data) =>
										handleClick(decorator, ...data),
									...decorator.props,
								})
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}

const Searcher = (props) => {
	const [loading, setLoading] = React.useState(false)
	const [searchResult, setSearchResult] = React.useState(null)
	const [searchValue, setSearchValue] = React.useState("")

	const [query, setQuery] = useUrlQueryActiveKey({
		queryKey: "search",
		defaultKey: null,
	})

	const makeSearch = async (value) => {
		if (value === "") {
			return setSearchResult(null)
		}

		setLoading(true)

		if (props.useUrlQuery) {
			setQuery(value)
		}

		let result = null

		if (typeof props.model === "function") {
			result = await props.model(value, {
				...props.modelParams,
				limit: app.isMobile ? 3 : 5,
			})
		} else {
			result = await SearchModel.search(value, {
				...props.modelParams,
				limit: app.isMobile ? 3 : 5,
			})
		}

		if (typeof props.onSearchResult === "function") {
			await props.onSearchResult(result)
		}

		setLoading(false)

		return setSearchResult(result)
	}

	const debounceSearch = React.useCallback(
		lodash.debounce(makeSearch, 500),
		[],
	)

	const handleOnSearch = (e) => {
		// not allow to input space as first character
		if (e.target.value[0] === " ") {
			return
		}

		setSearchValue(e.target.value)

		if (e.target.value === "") {
			debounceSearch.cancel()

			if (props.useUrlQuery) {
				setQuery(null)
			}

			if (typeof props.onEmpty === "function") {
				props.onEmpty()
			}
		} else {
			if (typeof props.onFilled === "function") {
				props.onFilled()
			}

			debounceSearch(e.target.value)
		}
	}

	React.useEffect(() => {
		if (props.useUrlQuery) {
			if (typeof query === "string") {
				makeSearch(query)
				setSearchValue(query)
			}
		}
	}, [])

	return (
		<div
			className={classnames("searcher", {
				["open"]: searchValue,
				["small"]: props.small,
			})}
		>
			<antd.Input
				placeholder="Start typing to search..."
				onChange={handleOnSearch}
				value={searchValue}
				prefix={<Icons.Search />}
				autoFocus={props.autoFocus ?? false}
				onFocus={props.onFocus}
				onBlur={props.onUnfocus}
			/>

			{searchResult && props.renderResults && (
				<Results
					loading={loading}
					results={searchResult}
					onClose={props.close}
				/>
			)}
		</div>
	)
}

export default Searcher
