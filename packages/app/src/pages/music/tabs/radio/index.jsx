import React from "react"
import { Skeleton, Result } from "antd"

import RadioModel from "@endpoints/radio"

import Radio from "@components/Music/Radio"

import "./index.less"
import useRequest from "comty.js/hooks/useRequest"

const RadioTab = () => {
	const [L_Radios, R_Radios, E_Radios, M_Radios] = useRequest(
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
				<Radio key={item.id} item={item} />
			))}

			<Radio style={{ opacity: 0.5 }} />
			<Radio style={{ opacity: 0.4 }} />
			<Radio style={{ opacity: 0.3 }} />
		</div>
	)
}

export default RadioTab
