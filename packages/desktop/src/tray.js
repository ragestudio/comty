export default [
	{
		label: "Show",
		onClick: (ctx) => {
			ctx.mainWindow.show()
		},
	},
	{
		label: "Quit",
		onClick: (ctx) => {
			ctx.app.quit()
		},
	},
]
