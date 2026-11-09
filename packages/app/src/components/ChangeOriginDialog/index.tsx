import React from "react"

import styles from "./index.module.less"
import createBem from "@/utils/createBem"
import { Alert, Input } from "antd"
import client from "comty.js/core/client"
import Button from "@/ui/Button"

const b = createBem("change-origin-dialog", styles)

function parseOrigin(input: string): string | null {
	const trimmed = input.trim()

	if (!trimmed) return null

	const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
		? trimmed
		: `http://${trimmed}`

	try {
		const url = new URL(candidate)

		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null
		}

		const path = url.pathname.replace(/\/+$/, "")

		return `${url.origin}${path}`
	} catch {
		return null
	}
}

function requestReload() {
	app.layout.modal.confirm({
		headerText: "Reload required",
		descriptionText: "The app needs to reload to use the new API origin",
		onConfirm: () => {
			app.navigation.reload()
		},
	})
}

export const ChangeOriginDialog = (props) => {
	const [origin, setOrigin] = React.useState(client.origin)

	const handleChangeOrigin = () => {
		console.log("changing api origin to:", origin)
		window.localStorage.setItem("api-origin-override", origin)
		requestReload()
	}

	const handleChangeOriginToDefault = () => {
		console.log("resetting api origin to default")
		window.localStorage.removeItem("api-origin-override")
		requestReload()
	}

	return (
		<div className={b()}>
			<div className={b.elem("header")}>
				<h2>Hold on a moment!</h2>

				<span>
					Changing the API origin to a custom one means that all requests,
					processing, and data will be handled by that origin.
				</span>

				<span>
					This can lead to a serious security risk, as well as potential
					compatibility issues.
				</span>

				<span>
					If you want to use an alternative community instance, it is
					recommended that you use the application distribution provided by that
					instance.
				</span>

				<Alert
					type="warning"
					title="You may continue if you accept the risks and are certain that this new
				origin is secure."
				/>

				<div className={b.elem("field")}>
					<span>New origin URL</span>
					<Input
						value={origin}
						onChange={(e) => setOrigin(e.target.value)}
					/>
				</div>

				<div className={b.elem("actions")}>
					<Button onClick={() => props.close?.()}>Nevermind</Button>
					<Button onClick={handleChangeOriginToDefault}>Use the default</Button>
					<Button
						className={b.elem("actions__danger")}
						onClick={handleChangeOrigin}
					>
						Change origin
					</Button>
				</div>
			</div>
		</div>
	)
}

export const openDialog = () => {
	app.layout.modal.open("change-origin-dialog", <ChangeOriginDialog />)
}

export default ChangeOriginDialog
