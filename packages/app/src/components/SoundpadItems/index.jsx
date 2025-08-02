import GroupModel from "@models/groups"
import SoundpadItem from "@components/SoundpadItem"

import "./index.less"

const SoundpadItems = ({ group_id, dispatch }) => {
	const [L_Items, R_Items, E_Items] = app.cores.api.useRequest(
		GroupModel.soundpad.getItems,
		group_id,
	)

	if (E_Items) {
		return <p>Failed to load items</p>
	}

	if (L_Items) {
		return <p>Loading</p>
	}

	return (
		<div className="soundpad-items">
			{R_Items.map((item) => {
				return (
					<SoundpadItem
						key={item._id}
						item={item}
						onClick={() => dispatch(item.src)}
					/>
				)
			})}
		</div>
	)
}

export default SoundpadItems
