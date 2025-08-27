import path from "path"

export default {
	"@": path.join(__dirname, "src"),
	"@config": path.join(__dirname, "config"),
	"@cores": path.join(__dirname, "src/cores"),
	"@pages": path.join(__dirname, "src/pages"),
	"@styles": path.join(__dirname, "src/styles"),
	"@components": path.join(__dirname, "src/components"),
	"@contexts": path.join(__dirname, "src/contexts"),
	"@utils": path.join(__dirname, "src/utils"),
	"@layouts": path.join(__dirname, "src/layouts"),
	"@hooks": path.join(__dirname, "src/hooks"),
	"@classes": path.join(__dirname, "src/classes"),
	"@models": path.join(__dirname, "../../", "comty.js/src/models"),
	"comty.js": path.join(__dirname, "../../", "comty.js", "src"),
	"@ragestudio/vessel": path.join(__dirname, "../../", "vessel", "src"),
	vessel: path.join(__dirname, "../../", "vessel", "src"),
}
