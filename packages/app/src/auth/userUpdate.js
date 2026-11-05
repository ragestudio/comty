export default (user) => {
	if (!user?._id) return

	if (app.userData?._id === user._id) {
		app.userData = {
			...app.userData,
			...user,
		}
	}

	app.eventBus.emit("user:update", user)
}
