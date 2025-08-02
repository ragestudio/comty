export default async function (producerId) {
	const audioElement = this.audioElements.get(producerId)

	if (audioElement) {
		audioElement.pause()
		audioElement.srcObject = null

		if (audioElement.parentNode) {
			audioElement.parentNode.removeChild(audioElement)
		}
	}

	this.audioElements.delete(producerId)
}
