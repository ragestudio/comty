import React from "react"
import * as antd from "antd"
import { FastAverageColor } from "fast-average-color"

import UserPreview from "@components/UserPreview"

import SpectrumModel from "@models/spectrum"

import useCenteredContainer from "@hooks/useCenteredContainer"

import "./index.less"
import classNames from "classnames"

const fac = new FastAverageColor()

const LivestreamItemSkeleton = (props) => {
	return (
		<div className="livestream_item">
			<antd.Skeleton active />
		</div>
	)
}

const LivestreamItem = (props) => {
	const { livestream = {} } = props

	const itemRef = React.useRef()
	const imageRef = React.useRef()

	const handleOnClick = async () => {
		if (typeof props.onClick !== "function") {
			console.warn("LivestreamItem: onClick is not a function")
			return
		}

		return await props.onClick(livestream)
	}

	if (!livestream) {
		return null
	}

	React.useEffect(() => {
		if (livestream.info?.thumbnail) {
			fac.getColorAsync(livestream.info?.thumbnail, {
				left: 0,
				top: 0,
			}).then((color) => {
				const colorEnd = [...color.value.slice(0, 3), 0].join(",")
				const gradient = `linear-gradient(to top, rgba(${colorEnd}) 0%, ${color.rgba} 100%)`

				if (color.isLight) {
					itemRef.current.classList.add("white_background")
				}

				itemRef.current.style.backgroundImage = gradient
			})
		}
	}, [])

	return (
		<div className="livestream_item" onClick={handleOnClick} ref={itemRef}>
			<div className="livestream_thumbnail">
				<img
					src={livestream.info?.thumbnail ?? "/assets/new_file.png"}
					ref={imageRef}
				/>
			</div>

			<div className="livestream_info">
				<div className="livestream_titles">
					<div className="livestream_title">
						<h1>{livestream.info?.title}</h1>
					</div>

					<div className="livestream_description">
						<h2>
							{livestream.info?.description ?? "No description"}
						</h2>
					</div>
				</div>

				<UserPreview user_id={livestream.user_id} small />
			</div>
		</div>
	)
}

export default (props) => {
	const [L_Streams, R_Streams, E_Streams] = app.cores.api.useRequest(
		SpectrumModel.list,
	)

	useCenteredContainer(false)

	const onClickItem = (livestream) => {
		app.location.push(`/tv/live/${livestream._id}`)
	}

	if (E_Streams) {
		console.error(E_Streams)

		return (
			<antd.Result
				status="error"
				title="Failed to load livestreams"
				subTitle="Please try again later"
			/>
		)
	}

	if (L_Streams || !R_Streams) {
		return <antd.Skeleton active />
	}

	return (
		<div
			className={classNames("livestream_list", {
				["empty"]: R_Streams.length === 0,
			})}
		>
			{R_Streams.length === 0 && (
				<antd.Result>
					<h1>No livestreams found</h1>
				</antd.Result>
			)}

			{L_Streams && (
				<>
					<LivestreamItemSkeleton />
					<LivestreamItemSkeleton />
					<LivestreamItemSkeleton />
				</>
			)}

			{R_Streams.length !== 0 &&
				R_Streams.map((livestream, index) => {
					return (
						<LivestreamItem
							key={index}
							livestream={livestream}
							onClick={onClickItem}
						/>
					)
				})}
		</div>
	)
}
