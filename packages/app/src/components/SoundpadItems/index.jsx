import useRequest from "comty.js/hooks/useRequest"
import GroupModel from "@endpoints/groups"
import SoundpadItem from "@components/SoundpadItem"

import "./index.less"

const SoundpadCategory = ({ label, items, dispatch }) => {
	if (items.length === 0) return null

	return (
		<section className="soundpad-items__category">
			<h4 className="soundpad-items__category__title">{label}</h4>

			<div className="soundpad-items__grid">
				{items.map((item) => (
					<SoundpadItem
						key={item._id}
						item={item}
						onClick={() => dispatch(item)}
					/>
				))}
			</div>
		</section>
	)
}

const SoundpadItems = ({ group_id, dispatch }) => {
	const [L_Items, R_Items, E_Items] = useRequest(
		GroupModel.soundpad.getItems,
		group_id,
	)

	if (E_Items) {
		return <p>Failed to load items</p>
	}

	if (L_Items) {
		return <p>Loading</p>
	}

	const items = Array.isArray(R_Items) ? R_Items : []

	const groupItems = items.filter((item) => !item.built_in)
	const defaultItems = items.filter((item) => item.built_in)

	return (
		<div className="soundpad-items">
			<SoundpadCategory
				label="Group sounds"
				items={groupItems}
				dispatch={dispatch}
			/>

			<SoundpadCategory
				label="Default sounds"
				items={defaultItems}
				dispatch={dispatch}
			/>

			{items.length === 0 && <p>No sounds available</p>}
		</div>
	)
}

export default SoundpadItems
