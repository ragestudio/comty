import React from "react"
import { Skeleton, Result } from "antd"
import RadioModel from "@models/radio"
import Image from "@components/Image"

import { MdPlayCircle, MdHeadphones } from "react-icons/md"

import "./index.less"

const RadioItem = ({ item }) => {
	const start = () => {
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

	return (
		<div className="radio-list-item" onClick={start}>
			<Image className="radio-list-item-cover" src={item.background} />
			<div className="radio-list-item-content">
				<h1>{item.name}</h1>
				<p>{item.description}</p>

				<div className="radio-list-item-info">
					<div className="radio-list-item-info-item" id="now_playing">
						<MdPlayCircle />
						<span>{item.now_playing.song.text}</span>
					</div>
					<div className="radio-list-item-info-item" id="now_playing">
						<MdHeadphones />
						<span>{item.listeners}</span>
					</div>
				</div>
			</div>
		</div>
	)
}

const RadioTab = () => {
	const [L_Radios, R_Radios, E_Radios, M_Radios] = app.cores.api.useRequest(
		RadioModel.getRadioList,
	)

	if (E_Radios) {
		return <Result status="warning" title="Error to load radio list" />
	}

	if (L_Radios) {
		return <Skeleton active />
	}

	return (
		<div className="radio-list">
			{R_Radios.map((item) => (
				<RadioItem key={item.id} item={item} />
			))}
		</div>
	)
}

export default RadioTab
