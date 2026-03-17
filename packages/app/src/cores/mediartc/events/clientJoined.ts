import MediaRTC from "../mediartc.core"

export default async (core: MediaRTC, data: any) => {
	try {
		await core.clients.join(data)
	} catch (error) {
		core.console.error("Error handling client joined:", error)
	}
}
