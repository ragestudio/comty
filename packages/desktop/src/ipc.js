export default {
	"window:minimize": (ctx) => {
		ctx.mainWindow.minimize()
	},
	"window:maximize": (ctx) => {
		ctx.mainWindow.maximize()
	},
	"window:close": (ctx) => {
		ctx.mainWindow.hide()
	},
}
