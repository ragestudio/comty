import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicModel from "@models/music"

const loadLimit = 50

const TracksLibraryView = () => {
	const [offset, setOffset] = React.useState(0)
	const [items, setItems] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)
	const [initialLoading, setInitialLoading] = React.useState(true)

	const [L_Library, R_Library, E_Library, M_Library] =
		app.cores.api.useRequest(MusicModel.getMyLibrary, {
			offset: offset,
			limit: loadLimit,
			kind: "tracks",
		})

	async function onLoadMore() {
		setOffset((prevOffset) => {
			const newOffset = prevOffset + loadLimit

			M_Library({
				offset: newOffset,
				limit: loadLimit,
				kind: "tracks",
			})

			if (newOffset >= R_Library.total_items) {
				setHasMore(false)
			}

			return newOffset
		})
	}

	React.useEffect(() => {
		if (R_Library && R_Library.items) {
			if (initialLoading === true) {
				setInitialLoading(false)
			}

			setItems((prev) => {
				prev = [...prev, ...R_Library.items]

				return prev
			})
		}
	}, [R_Library])

	if (E_Library) {
		return <antd.Result status="warning" title="Failed to load" />
	}

	if (initialLoading) {
		return <antd.Skeleton active />
	}

	return (
		<PlaylistView
			noHeader
			noSearch
			loading={L_Library}
			type="vertical"
			playlist={{
				items: items,
				total_length: R_Library.total_items,
			}}
			onLoadMore={onLoadMore}
			hasMore={hasMore}
		/>
	)
}

export default TracksLibraryView
