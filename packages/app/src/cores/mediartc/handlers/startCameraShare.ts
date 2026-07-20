export default async function (options) {
	await this.self.createCameraStream(options)
	await this.self.startCameraProducer()

	app.cores.sfx.play("media_video_join")

	this.console.log("camera share started")
}
