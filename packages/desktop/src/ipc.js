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
