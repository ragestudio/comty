function userDataMap(data) {
	const users = new Map(data.users.map((user) => [user._id, user]))

	data.items = data.items.map((item) => {
		item.user = users.get(item.user_id) ?? {
			username: "unknown",
			public_name: "Ghost",
			unknown: true,
		}

		return item
	})

	return data
}

export default userDataMap
