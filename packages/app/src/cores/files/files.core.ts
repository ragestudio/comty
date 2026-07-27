import { Core } from "vessel/core"
import xxhash, { XXHashAPI } from "xxhash-wasm"
import UploadTasksManager from "./task/manager"

import uploadHandler from "./handlers/upload"
import dialogHandler from "./handlers/dialog"
import hashFileHandler from "./handlers/hashFile"

export class FilesCore extends Core {
	static namespace = "files"
	static dependencies = ["api", "settings", "notifications", "tasksQueue"]

	xxhashInstance: XXHashAPI
	tasks = new UploadTasksManager(this)

	upload = uploadHandler.bind(this) as OmitThisParameter<typeof uploadHandler>
	dialog = dialogHandler.bind(this) as OmitThisParameter<typeof dialogHandler>
	hashFile = hashFileHandler.bind(this) as OmitThisParameter<
		typeof hashFileHandler
	>

	public = {
		upload: this.upload,
		dialog: this.dialog,
	}

	async onInitialize() {
		this.xxhashInstance = await xxhash()
	}
}

export default FilesCore
