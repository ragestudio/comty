export default async function ({ deviceId } = {}) {
	if (deviceId && this.audioOutput?.context) {
		this.audioOutput.context.setSinkId(deviceId)
	}
}
