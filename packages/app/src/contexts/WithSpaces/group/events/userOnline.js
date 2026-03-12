export default (data, setData, payload) => {
	console.debug("User switch to connected", payload)

	setData((prev) => {
		const connected_members = [...prev]

		if (!connected_members.includes(payload.userId)) {
			connected_members.push(payload.userId)
		}

		return connected_members
	})
}
