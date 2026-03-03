export default (data, setData, payload) => {
	console.log("User switch to offline", payload)

	setData((prev) => {
		let connected_members = [...prev]

		if (connected_members.includes(payload.userId)) {
			connected_members = connected_members.filter(
				(memberId) => memberId !== payload.userId,
			)
		}

		return connected_members
	})
}
