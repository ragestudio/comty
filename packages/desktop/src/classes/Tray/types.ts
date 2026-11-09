import type { MenuItemConstructorOptions } from "electron"
import type { TrayManager } from "./index.js"

export interface TrayItem extends MenuItemConstructorOptions {
	onClick?: (item: TrayItem, manager: TrayManager) => Promise<any> | any
}
