export default async function () {
	await this.self.stopCameraProducer()
	await this.self.destroyCameraStream()

	app.cores.sfx.play("media_video_leave")

	this.console.log("camera share stopped")
}
