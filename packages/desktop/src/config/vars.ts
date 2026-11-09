import path from "node:path"
import { fileURLToPath } from "node:url"

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const vars = {
	productionUrl: "https://comty.app",
	indevUrl: "https://indev.comty.app",
	developmentUrl: "http://localhost:8000",
	iconPath: path.resolve(currentDir, "../../resources/icon-512.png"),
}

export default vars
