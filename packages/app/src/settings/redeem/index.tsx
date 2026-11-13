import type { SettingTabModule } from "@/pages/settings/types"

import loadable from "@loadable/component"

export const settings: SettingTabModule = {
	id: "redeem",
	label: "Redeem",
	icon: "TicketSlash",
	settings: [
		{
			id: "redeem-code",
			component: loadable(
				() => import("../components/accountRedeemCode"),
			),
			icon: "Ticket",
			title: "Redeem code",
			description:
				"Redeem a code to receive decorations, badges or other rewards",
		},
	],
}

export default settings
