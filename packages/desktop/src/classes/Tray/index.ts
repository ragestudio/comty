import { Menu, Tray, type MenuItemConstructorOptions } from "electron"

import type { TrayItem } from "./types.js"
import type Main from "../../main.js"

import trayItems from "../../config/tray.js"
import vars from "../../config/vars.js"

export class TrayManager {
	instance: Tray | null = null

	constructor(public main: Main) {}

	create(): void {
		if (this.instance) {
			return
		}

		const template: MenuItemConstructorOptions[] = trayItems.map((item) => {
			const { onClick, ...menuItem } = item

			return {
				...menuItem,
				click: () => this.onTrayItemClick(item),
			}
		})

		const menu = Menu.buildFromTemplate(template)

		this.instance = new Tray(vars.iconPath)
		this.instance.setContextMenu(menu)
		this.instance.on("double-click", this.onTrayDoubleClick)
	}

	destroy(): void {
		this.instance?.destroy()
		this.instance = null
	}

	onTrayDoubleClick = (): void => {
		this.main.mainWindow?.show()
	}

	onTrayItemClick = async (item: TrayItem): Promise<void> => {
		await item.onClick?.(item, this)
	}
}
