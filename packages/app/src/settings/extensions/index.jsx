import React from "react"
import loadable from "@loadable/component"

export default {
	id: "extensions",
	icon: "Blocks",
	label: "Extensions",
	group: "advanced",
	render: () => {
		const ExtensionsPage = loadable(() => import("./page"))
		return <ExtensionsPage />
	},
}
