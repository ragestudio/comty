import loadable from "@loadable/component"
import UserModel from "@endpoints/user"
import { Icons } from "@components/Icons"

import ProfileEditor from "./editor"

import "./index.less"

export default {
	id: "profile",
	icon: "User",
	label: "Profile",
	group: "basic",
	ctxData: async () => ({
		userData: await UserModel.data(),
	}),
	settings: [
		{
			id: "preview",
			group: "account.preview",
			render: ProfileEditor,
		},
		{
			id: "email",
			group: "account.extra",
			component: "Input",
			icon: "Mail",
			title: "Email",
			description: "Change your email address",
			props: {
				placeholder: "Enter your email address",
				allowClear: { clearIcon: <Icons.CircleX /> },
				showCount: true,
				maxLength: 320,
			},
			defaultValue: (ctx) => {
				return ctx.userData.email
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					email: value,
				})

				if (result) {
					return value
				}
			},
			debounced: true,
		},
		{
			id: "Links",
			group: "account.extra",
			component: loadable(() => import("../components/profileLinks")),
			icon: "Link2",
			title: "Links",
			description: "Add links to your profile",
			onUpdate: async (value) => {
				// filter invalid links
				value = value.filter((link) => {
					return link.key && link.value
				})

				const result = await UserModel.updateData({
					links: value,
				})

				if (result) {
					return result.links
				}
			},
			defaultValue: (ctx) => {
				return ctx.userData.links ?? []
			},
			debounced: true,
		},
	],
}
