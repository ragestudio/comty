import Popover from "@ui/Popover"

import "./index.less"

const SoundpadItem = ({ item, onClick }) => {
	return (
		<Popover
			trigger="hover"
			content={
				<span style={{ width: "fit-content", whiteSpace: "nowrap" }}>
					{item.icon} {item.name}
				</span>
			}
		>
			<div
				className="soundpad-items__item"
				onClick={onClick}
			>
				{item.icon ?? item.name}
			</div>
		</Popover>
	)
}

export default SoundpadItem
