import { Modal } from "antd"
import loadable from "@loadable/component"
import UploadButton from "@components/UploadButton"

import "./index.less"

export default {
	id: "appearance",
	icon: "PaintRoller",
	label: "Apparence",
	group: "app",
	order: 1,
	settings: [
		{
			id: "style:variant_mode",
			group: "aspect",
			icon: "SunMoon",
			title: "Theme",
			description: "Change the theme of the application.",
			component: loadable(
				() => import("../components/themeVariantSelector"),
			),
			layout: "horizontal",
		},
		{
			id: "style.compactMode",
			group: "aspect",
			component: "Switch",
			icon: "Shrink",
			title: "Compact mode",
			description: "Reduce the size of the application elements.",
			defaultValue: () => {
				return app.cores.style.vars["compact-mode"]
			},
			onUpdate: (value) => {
				app.cores.style.modifyTheme({
					"compact-mode": value,
				})

				return value
			},
			storaged: true,
		},
		{
			id: "style.uiFontScale",
			group: "aspect",
			component: "Slider",
			icon: "ALargeSmall",
			title: "Font scale",
			description: "Change the font scale of the application.",
			props: {
				min: 1,
				max: 1.2,
				step: 0.01,
				tooltip: {
					formatter: (value) => `x${value}`,
				},
			},
			defaultValue: () => {
				return app.cores.style.vars["fontScale"]
			},
			onUpdate: (value) => {
				app.cores.style.modifyTheme({
					fontScale: value,
				})

				return value
			},
			storaged: true,
		},
		{
			id: "style.colorPrimary",
			group: "aspect",
			component: "SliderColorPicker",
			icon: "Palette",
			title: "Primary color",
			description: "Change primary color of the application.",
			defaultValue: () => {
				return app.cores.style.vars["colorPrimary"]
			},
			onUpdate: (value) => {
				app.cores.style.modifyTheme({
					colorPrimary: value,
				})
			},
			storaged: false,
		},
		{
			id: "style.backgroundImage",
			group: "aspect",
			icon: "Wallpaper",
			title: "Wallpaper",
			description:
				"Change background image of the application. You can use a local image or a remote image (URL).",
			component: loadable(() => import("../components/wallpaper")),
			props: {
				noPreview: true,
			},
			extraActions: [
				{
					id: "delete",
					icon: "Delete",
					title: "Remove",
					onClick: (ctx) => {
						return ctx.dispatchUpdate("")
					},
				},
				(...props) => React.createElement(UploadButton, ...props),
			],
			defaultValue: () => {
				const value = app.cores.style.vars["backgroundImage"]

				return value ? value.replace(/url\(|\)/g, "") : ""
			},
			onUpdate: (value) => {
				if (value !== "") {
					value = value.trim()
					value = `url(${value})`
				}

				app.cores.style.modifyTheme({
					backgroundImage: value,
				})

				return value
			},
			storaged: false,
		},
		{
			id: "resetTheme",
			group: "aspect",
			component: "Button",
			icon: "RotateCcw",
			title: "Reset to default theme",
			props: {
				children: "Reset",
			},
			onUpdate: (value) => {
				Modal.confirm({
					title: "Are you sure you want to reset the theme to the default theme ?",
					description:
						"This action will reset the theme to the default theme. All your modifications will be lost.",
					onOk: () => {
						app.cores.style.resetToDefault()
					},
				})
			},
			storaged: false,
		},
	],
}
