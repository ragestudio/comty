import { fileURLToPath } from "node:url"
import path from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
	productionUrl: "https://comty.app",
	indevUrl: "https://indev.comty.app",
	developmentUrl: "http://localhost:8000",
	iconPath: path.join(__dirname, "../assets/icon-512.png"),
}
