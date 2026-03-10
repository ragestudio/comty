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
	"app:restart": (ctx) => {
		ctx.restart()
	},
	"desktopcapturer:initialize": async (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return await desktopCapturerModule.initialize()
	},
	"extensions:load": async (ctx, event, ...args) => {
		//return await ctx.extensions.load(...args)
	},
	"extensions:list": (ctx, event, ...args) => {
		return ctx.extensions
	},
	"extensions:install": async (ctx, event, ...args) => {
		return await ctx.extensions.install(...args)
	},
}
