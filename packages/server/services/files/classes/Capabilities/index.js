import checkH264Nvenc from "./checks/h264Nvenc"
import checkH264Vaapi from "./checks/h264Vaapi"
import checkh265Nvenc from "./checks/h265Nvenc"
import checkH265Vaapi from "./checks/h265Vaapi"

export default class Capabilities {
	constructor() {
		this.encoders = []
	}

	async initialize() {
		if (await checkH264Nvenc()) {
			this.encoders.push("h264_nvenc")
		}

		if (await checkH264Vaapi()) {
			this.encoders.push("h264_vaapi")
		}

		if (await checkh265Nvenc()) {
			this.encoders.push("h265_nvenc")
		}

		if (await checkH265Vaapi()) {
			this.encoders.push("h265_vaapi")
		}
	}
}
