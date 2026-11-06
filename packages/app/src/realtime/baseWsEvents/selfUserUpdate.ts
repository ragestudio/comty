import type { User } from "@comty/shared/types/user"

export default (user: User) => {
	if (!user?._id) return

	if (app.userData?._id === user._id) {
		app.userData = {
			...app.userData,
			...user,
		}
	}

	app.eventBus.emit("user:update", user)
}
