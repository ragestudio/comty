export default async function (options) {
	await this.self.createScreenStream(options)
	await this.self.startScreenProducer()

	app.cores.sfx.play("media_video_join")

	this.console.log("screen share started")
}
