import User from "@db_models/user"

export type ResolveUserIdPayload = {
	username: string
}

export type ResolveUserIdResult = {
	user_id: string
}

export default async (
	payload: ResolveUserIdPayload = {} as ResolveUserIdPayload,
): Promise<ResolveUserIdResult> => {
	const { username } = payload

	if (!username) {
		throw new OperationError(400, "Missing username")
	}

	const user = await User.findOne({
		username,
	}).catch(() => null)

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	return {
		user_id: user._id.toString(),
	}
}
