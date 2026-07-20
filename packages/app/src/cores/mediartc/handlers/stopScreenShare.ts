export default async function () {
	await this.self.stopScreenProducer()
	await this.self.destroyScreenStream()

	this.state.screenStreamInitialized = false

	app.cores.sfx.play("media_video_leave")

	this.console.log("screen share stopped")
}
