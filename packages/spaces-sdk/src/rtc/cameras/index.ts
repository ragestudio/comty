import type { RTC } from ".."

import { RemoteMedias } from "@/rtc/remote/collection"
import { RemoteMedia } from "@/rtc/remote/media"

export class Cameras extends RemoteMedias<RemoteMedia> {
	constructor(core: RTC) {
		super(core, (core, userId, collection) => {
			return new RemoteMedia(core, userId, collection)
		})
	}

	syncState(): void {
		this.core.setState({
			statedCameras: Array.from(this.values()).map((media) =>
				media.serialize(),
			),
		})
	}
}

export default Cameras
