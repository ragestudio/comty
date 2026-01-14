export default (data, setData, payload) => {
	setData((prev) => {
		let connected_members = [...prev.connected_members]

		if (connected_members.includes(payload.userId)) {
			connected_members = connected_members.filter(
				(memberId) => memberId !== payload.userId,
			)
		}

		return {
			...prev,
			connected_members: connected_members,
		}
	})
}
