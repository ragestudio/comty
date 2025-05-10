import React from "react"
import { Skeleton, Result } from "antd"
import RadioModel from "@models/radio"
import Image from "@components/Image"

import { MdPlayCircle, MdHeadphones } from "react-icons/md"

import "./index.less"

const Radio = ({ item, style }) => {
	const onClickItem = () => {
		app.cores.player.start(
			{
				title: item.name,
				source: item.http_src,
				cover: item.background,
			},
			{
				radioId: item.radio_id,
			},
		)
	}

	if (!item) {
		return (
			<div className="radio-item empty" style={style}>
				<div className="radio-item-content">
					<Skeleton />
				</div>
			</div>
		)
	}

	return (
		<div className="radio-item" onClick={onClickItem} style={style}>
			<Image className="radio-item-cover" src={item.background} />
			<div className="radio-item-content">
				<h1 id="title">{item.name}</h1>
				<p>{item.description}</p>

				<div className="radio-item-info">
					<div className="radio-item-info-item" id="now_playing">
						<MdPlayCircle />
						<span>{item.now_playing.song.text}</span>
					</div>

					<div className="radio-item-info-item" id="now_playing">
						<MdHeadphones />
						<span>{item.listeners}</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Radio
