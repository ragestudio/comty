import React from "react"
import { Skeleton } from "antd"
import Lottie from "lottie-react"

import StickersModel from "@models/stickers"

import "./index.less"

const StickerRender = ({ obj }) => {
	if (!obj || (obj?.animated && !obj?.data)) {
		return <Skeleton.Image active />
	}

	if (obj.animated && obj.data) {
		return (
			<Lottie
				animationData={obj.data}
				loop={true}
			/>
		)
	}

	if (obj.video && obj.file_url) {
		return (
			<video
				src={obj.file_url}
				autoPlay={true}
				loop={true}
				muted={true}
			/>
		)
	}

	return <img src={obj.file_url} />
}

const Sticker = ({ id, sticker, onClick, onDoubleClick }) => {
	const [obj, setObj] = React.useState(sticker)

	const handleDoubleClick = React.useCallback(() => {
		if (typeof onDoubleClick === "function") {
			return onDoubleClick(obj)
		}

		if (obj) {
			app.controls.openFullImageViewer(
				React.createElement(StickerRender, {
					obj,
				}),
			)
		}
	}, [obj])

	const loadAnimData = React.useCallback(async () => {
		if (!sticker || !sticker?.file_url || !sticker?.animated) {
			return false
		}

		const response = await fetch(sticker.file_url)
		const anim = await response.json()

		setObj((prev) => {
			return {
				...(prev ?? {}),
				data: anim,
			}
		})
	}, [sticker])

	React.useEffect(() => {
		if (id && !sticker) {
			StickersModel.get(id, {
				fetchData: true,
			}).then((sticker) => {
				setObj(sticker)
			})
		}
	}, [id])

	React.useEffect(() => {
		if (sticker && sticker.animated && !sticker.data) {
			loadAnimData()
		}
	}, [sticker])

	return (
		<div
			className="sticker-render"
			onClick={onClick}
			onDoubleClick={handleDoubleClick}
		>
			<StickerRender obj={obj} />
		</div>
	)
}

export default Sticker
