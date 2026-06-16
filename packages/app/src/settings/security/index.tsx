import { Setting } from "@/pages/settings/types"
import loadable from "@loadable/component"

import {
	TOTPDisableComponent,
	TOTPSetupComponent,
} from "../components/totpSetup"

export default {
	id: "security",
	icon: "Shield",
	label: "Security",
	group: "basic",
	settings: [
		{
			id: "change-password",
			group: "security.account",
			title: "Change Password",
			description: "Change your password",
			icon: "SquareAsterisk",
			component: loadable(() => import("../components/changePassword")),
		},
		{
			id: "auth:2fa-type",
			group: "security.account",
			title: "2-Factor Authentication",
			description:
				"Use short-lived codes from an authenticator source to secure your account.",
			icon: "LockKeyhole",
			component: "Select",
			props: {
				options: [
					{ value: "none", label: "Disabled" },
					{ value: "totp", label: "App Authenticator (recommended)" },
					{ value: "mfa", label: "Email-based" },
				],
			},
			onUpdate: async (value, prev) => {
				const hasEnabledTOTP = app.userData?.flags?.includes("has_totp")
				console.log("otp changed", { value, prev })

				if (value !== "totp" && hasEnabledTOTP) {
					const ok = await new Promise((_resolve, reject) => {
						app.layout.modal.open(
							"totp-disable-confirm",
							TOTPDisableComponent,
							{
								props: {
									resolve: () => _resolve(true),
								},
								onClose: () => _resolve(false),
							},
						)
					})

					if (!ok) {
						return prev
					}
				}

				if (value === "totp" && !hasEnabledTOTP) {
					const ok = await new Promise((_resolve, reject) => {
						app.layout.modal.open("totp-setup-confirm", TOTPSetupComponent, {
							props: {
								resolve: () => _resolve(true),
							},
							onClose: () => _resolve(false),
						})
					})

					if (!ok) {
						return prev
					}
				}

				return value
			},
			defaultValue: (ctx) => {
				if (app.userData?.flags?.includes("has_totp")) {
					return "totp"
				}

				return ctx.baseConfig["auth:2fa-type"] ?? "none"
			},
		},
		{
			id: "sessions",
			group: "security.account",
			title: "Sessions",
			description: "Manage your active sessions",
			icon: "MonitorSmartphone",
			component: loadable(() => import("../components/sessions")),
		},
		{
			id: "disable-account",
			group: "security.account",
			title: "Disable Account",
			description: "Disable your account",
			icon: "UserX",
			component: "Button",
			props: {
				danger: true,
				children: "Disable",
				onClick: () => {
					app.location.push("/disable-account")
				},
			},
		},
	] satisfies Setting[],
}
