import type { SettingTabModule } from "@/pages/settings/types"

import InventoryModel from "@endpoints/inventory"
import UserModel from "@endpoints/user"

import { InventoryPage } from "./components/inventoryPage"

export default {
	id: "inventory",
	icon: "Backpack",
	label: "Inventory",
	group: "basic",
	ctxData: async () => {
		const [userData, inventory] = await Promise.all([
			UserModel.data().catch(() => null),
			InventoryModel.list().catch(() => ({ items: [] })),
		])

		return {
			userData,
			inventory,
		}
	},
	render: InventoryPage,
} satisfies SettingTabModule
