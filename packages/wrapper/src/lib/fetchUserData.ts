export default async (username: string) => {
	if (typeof username !== "string") {
		throw new Error("Invalid or missing username")
	}

	let response = await fetch(
		`https://api.comty.app/users/${username}/resolve-user_id`,
	)

	if (!response.ok) {
		throw new Error(`Failed to resolve user ID: ${response.status}`)
	}

	let { user_id } = await response.json()

	response = await fetch(
		`https://api.comty.app/users/${user_id}/data?basic=true`,
	)

	if (!response.ok) {
		throw new Error(`Failed to user avatar data: ${response.status}`)
	}

	return await response.json()
}
