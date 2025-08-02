export default async function (options) {
	await this.handlers.initializeUserScreen(options)
	await this.handlers.startScreenProducer()

	app.cores.sfx.play("media_video_join")

	this.console.log("screen share started")
}
