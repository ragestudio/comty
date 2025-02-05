import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "@components/Icons"
import Playlist from "@components/Music/Playlist"

import "./index.less"

const ReleasesList = (props) => {
	const hopNumber = props.hopsPerPage ?? 9

	const [offset, setOffset] = React.useState(0)
	const [ended, setEnded] = React.useState(false)

	const [loading, result, error, makeRequest] = app.cores.api.useRequest(
		props.fetchMethod,
		{
			limit: hopNumber,
			trim: offset,
		},
	)

	const onClickPrev = () => {
		if (offset === 0) {
			return
		}

		setOffset((value) => {
			const newOffset = value - hopNumber

			// check if newOffset is NaN
			if (newOffset !== newOffset) {
				return false
			}

			if (typeof makeRequest === "function") {
				makeRequest({
					trim: newOffset,
					limit: hopNumber,
				})
			}

			return newOffset
		})
	}

	const onClickNext = () => {
		if (ended) {
			return
		}

		setOffset((value) => {
			const newOffset = value + hopNumber

			// check if newOffset is NaN
			if (newOffset !== newOffset) {
				return false
			}

			if (typeof makeRequest === "function") {
				makeRequest({
					trim: newOffset,
					limit: hopNumber,
				})
			}

			return newOffset
		})
	}

	React.useEffect(() => {
		if (result) {
			if (typeof result.has_more !== "undefined") {
				setEnded(!result.has_more)
			} else {
				setEnded(result.items.length < hopNumber)
			}
		}
	}, [result])

	if (error) {
		console.error(error)

		return (
			<div className="playlistExplorer_section">
				<antd.Result
					status="warning"
					title="Failed to load"
					subTitle="We are sorry, but we could not load this requests. Please try again later."
				/>
			</div>
		)
	}

	return (
		<div className="music-releases-list">
			<div className="music-releases-list-header">
				<h1>
					{props.headerIcon}
					<Translation>{(t) => t(props.headerTitle)}</Translation>
				</h1>

				<div className="music-releases-list-actions">
					<antd.Button
						icon={<Icons.MdChevronLeft />}
						onClick={onClickPrev}
						disabled={offset === 0 || loading}
					/>

					<antd.Button
						icon={<Icons.MdChevronRight />}
						onClick={onClickNext}
						disabled={ended || loading}
					/>
				</div>
			</div>
			<div className="music-releases-list-items">
				{loading && <antd.Skeleton active />}
				{!loading &&
					result.items.map((playlist, index) => {
						return <Playlist key={index} playlist={playlist} />
					})}
			</div>
		</div>
	)
}

export default ReleasesList
