import { Tooltip } from "antd"

import "./index.less"

const SoundpadItem = ({ item, onClick }) => {
	return (
		<Tooltip title={item.name}>
			<div
				className="soundpad-items__item"
				onClick={onClick}
			>
				{item.icon ?? item.name}
			</div>
		</Tooltip>
	)
}

export default SoundpadItem
