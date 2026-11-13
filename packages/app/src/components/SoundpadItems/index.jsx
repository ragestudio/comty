import React from "react"

import GroupModel from "@endpoints/groups"
import UserModel from "@endpoints/user"
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
	const [items, setItems] = React.useState({
		user: [],
		group: [],
		builtin: [],
	})
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState(null)

	React.useEffect(() => {
		let active = true

		const load = async () => {
			setLoading(true)

			const [userResult, groupResult] = await Promise.allSettled([
				UserModel.soundpad.getItems(),
				group_id
					? GroupModel.soundpad.getItems(group_id)
					: Promise.resolve([]),
			])

			if (!active) return

			const userItems =
				userResult.status === "fulfilled"
					? (userResult.value ?? [])
					: []
			const groupResponse =
				groupResult.status === "fulfilled"
					? (groupResult.value ?? [])
					: []

			setItems({
				user: userItems,
				group: groupResponse.filter(
					(item) =>
						item.scope === "group" ||
						(!item.scope && !item.built_in),
				),
				builtin: groupResponse.filter(
					(item) => item.scope === "builtin" || item.built_in,
				),
			})

			setError(
				userResult.status === "rejected" &&
					(!group_id || groupResult.status === "rejected")
					? "Failed to load soundpad items"
					: null,
			)

			setLoading(false)
		}

		load()

		return () => {
			active = false
		}
	}, [group_id])

	if (loading) {
		return <p>Loading</p>
	}

	if (error) {
		return <p>{error}</p>
	}

	const isEmpty =
		items.user.length === 0 &&
		items.group.length === 0 &&
		items.builtin.length === 0

	return (
		<div className="soundpad-items">
			<SoundpadCategory
				label="My sounds"
				items={items.user}
				dispatch={dispatch}
			/>

			<SoundpadCategory
				label="Group sounds"
				items={items.group}
				dispatch={dispatch}
			/>

			<SoundpadCategory
				label="Default sounds"
				items={items.builtin}
				dispatch={dispatch}
			/>

			{isEmpty && <p>No sounds available</p>}
		</div>
	)
}

export default SoundpadItems
