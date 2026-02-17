import React from "react"
import * as antd from "antd"

import Playlist from "@components/Music/Playlist"

import MusicModel from "@models/music"

const loadLimit = 50

const MyLibraryPlaylists = () => {
	const [offset, setOffset] = React.useState(0)
	const [items, setItems] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)
	const [initialLoading, setInitialLoading] = React.useState(true)

	const [L_Library, R_Library, E_Library, M_Library] =
		app.cores.api.useRequest(MusicModel.getMyLibrary, {
			offset: offset,
			limit: loadLimit,
			kind: "playlists",
		})

	async function onLoadMore() {
		const newOffset = offset + loadLimit

		setOffset(newOffset)

		M_Library({
			offset: newOffset,
			limit: loadLimit,
		})
	}

	React.useEffect(() => {
		if (R_Library && R_Library.items) {
			if (initialLoading === true) {
				setInitialLoading(false)
			}

			if (R_Library.items.length === 0) {
				setHasMore(false)
			} else {
				setItems((prev) => {
					prev = [...prev, ...R_Library.items]

					return prev
				})
			}
		}
	}, [R_Library])

	if (E_Library) {
		return (
			<antd.Result
				status="warning"
				title="Failed to load"
			/>
		)
	}

	if (initialLoading) {
		return <antd.Skeleton active />
	}

	return items.map((item, index) => {
		return (
			<Playlist
				row
				key={index}
				playlist={item}
			/>
		)
	})
}

export default MyLibraryPlaylists
