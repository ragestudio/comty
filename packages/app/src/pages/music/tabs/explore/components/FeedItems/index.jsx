import React from "react"
import classnames from "classnames"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "@components/Icons"

import Playlist from "@components/Music/Playlist"
import Track from "@components/Music/Track"
import Radio from "@components/Music/Radio"

import "./index.less"

const FeedItems = (props) => {
	const maxItems = props.itemsPerPage ?? 10

	const [page, setPage] = React.useState(0)
	const [ended, setEnded] = React.useState(false)

	const [loading, result, error, makeRequest] = app.cores.api.useRequest(
		props.fetchMethod,
		{
			limit: maxItems,
			page: page,
		},
	)

	const handlePageChange = (newPage) => {
		// check if newPage is NaN
		if (newPage !== newPage) {
			return false
		}

		if (typeof makeRequest === "function") {
			makeRequest({
				limit: maxItems,
				page: newPage,
			})
		}

		return newPage
	}

	const onClickPrev = () => {
		if (page === 0) {
			return
		}

		setPage((currentPage) => handlePageChange(currentPage - 1))
	}

	const onClickNext = () => {
		if (ended) {
			return
		}

		setPage((currentPage) => handlePageChange(currentPage + 1))
	}

	React.useEffect(() => {
		if (result) {
			if (typeof result.has_more !== "undefined") {
				setEnded(!result.has_more)
			} else {
				setEnded(result.items.length < maxItems)
			}
		}
	}, [result, maxItems])

	if (error) {
		console.error(error)

		return (
			<div className="music-feed-items">
				<antd.Result
					status="warning"
					title="Failed to load"
					subTitle="We are sorry, but we could not load this requests. Please try again later."
				/>
			</div>
		)
	}

	return (
		<div className={classnames("music-feed-items", props.type)}>
			<div className="music-feed-items-header">
				<h1>
					{props.headerIcon}
					<Translation>{(t) => t(props.headerTitle)}</Translation>
				</h1>

				{!props.disablePagination && (
					<div className="music-feed-items-actions">
						<antd.Button
							icon={<Icons.MdChevronLeft />}
							onClick={onClickPrev}
							disabled={page === 0 || loading}
						/>

						<antd.Button
							icon={<Icons.MdChevronRight />}
							onClick={onClickNext}
							disabled={ended || loading}
						/>
					</div>
				)}
			</div>

			<div className="music-feed-items-content">
				{loading && <antd.Skeleton active />}

				{!loading &&
					result?.items?.map((item, index) => {
						if (props.type === "radios") {
							return <Radio row key={index} item={item} />
						}

						if (props.type === "tracks") {
							return <Track key={index} track={item} />
						}

						return <Playlist row key={index} playlist={item} />
					})}
			</div>
		</div>
	)
}

export default FeedItems
