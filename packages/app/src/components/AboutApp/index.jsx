import React from "react"
import ReactDOM from "react-dom"
import * as antd from "antd"
import { Card as ACard, Mask as AMask } from "antd-mobile"

import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

export const Card = (props) => {
	const isProduction = import.meta.env.PROD

	const [serverManifest, setServerManifest] = React.useState(null)

	const checkServerVersion = async () => {
		const serverManifest = await app.api.customRequest("main")

		setServerManifest(serverManifest.data)
	}

	React.useEffect(() => {
		checkServerVersion()
	}, [])

	return <ACard
		bodyClassName="aboutApp_card"
		headerClassName="aboutApp_card_header"
		title={
			<div className="content">
				<div className="branding">
					<h2>{config.app.siteName}</h2>
					<span>{config.author}</span>
					<span> Licensed with {config.package?.license ?? "unlicensed"} </span>
				</div>
				<div>
					<antd.Tag><Icons.Tag />v{window.app.version ?? "experimental"}</antd.Tag>
					<antd.Tag color={isProduction ? "green" : "magenta"}>
						{isProduction ? <Icons.CheckCircle /> : <Icons.Triangle />}
						{String(import.meta.env.MODE)}
					</antd.Tag>
				</div>
			</div>
		}
	>
		<div className="group">
			<h3><Icons.GitMerge />Versions</h3>
			<div>
				<antd.Tag>Linebridge {serverManifest?.LINEBRIDGE_SERVER_VERSION ?? "Unknown"}</antd.Tag>
				<antd.Tag color="blue">React {React.version}</antd.Tag>
				<antd.Tag color="#ffec3d">eVite v{window.app.__eviteVersion ?? "experimental"}</antd.Tag>
			</div>
		</div>

		<div className="group">
			<h3><Icons.GitMerge />Server info</h3>
			<div>
				Server Time: {serverManifest?.requestTime ?? "Unknown"}
			</div>
			<div>
				Origin: {app.api.namespaces.main.origin ?? "Unknown"}
			</div>
		</div>
	</ACard>
}

export const ModalCard = (props) => {
	const [visible, setVisible] = React.useState(false)

	React.useEffect(() => {
		setVisible(true)
	}, [])

	const close = () => {
		setVisible(false)
		setTimeout(() => {
			props.onClose()
		}, 150)
	}

	return <AMask visible={visible} onMaskClick={() => close()}>
		<div className="aboutApp_wrapper">
			<Card />
		</div>
	</AMask >
}

export function openModal() {
	const component = document.createElement("div")
	document.body.appendChild(component)

	const onClose = () => {
		ReactDOM.unmountComponentAtNode(component)
		document.body.removeChild(component)
	}

	ReactDOM.render(<ModalCard onClose={onClose} />, component)
}