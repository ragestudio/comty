import type { TrayItem } from "../classes/Tray/types.js"

const trayItems: TrayItem[] = [
	{
		label: "Show",
		onClick: (item, manager) => {
			manager.main.mainWindow?.show()
		},
	},
	{
		label: "Quit",
		onClick: (item, manager) => {
			manager.main.app.quit()
		},
	},
]

export default trayItems
