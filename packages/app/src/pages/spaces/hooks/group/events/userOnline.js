export default (data, setData, payload) => {
	setData((prev) => {
		const connected_members = [...prev.connected_members]

		if (!connected_members.includes(payload.userId)) {
			connected_members.push(payload.userId)
		}

		return {
			...prev,
			connected_members: connected_members,
		}
	})
}
