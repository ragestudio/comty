export default async function ({ deviceId }: { deviceId?: string } = {}) {
	if (deviceId && this.audioOutput?.context) {
		this.audioOutput.context.setSinkId(deviceId)
	}
}
