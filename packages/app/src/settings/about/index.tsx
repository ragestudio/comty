import type { SettingTabModule } from "@/pages/settings/types"

import { AboutView } from "./components/AboutView"

import "./index.less"

const about: SettingTabModule = {
	id: "about",
	icon: "Info",
	label: "About",
	group: "bottom",
	settings: [],
	render: AboutView,
}

export default about
