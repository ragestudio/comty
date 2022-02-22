import React from "react"
import ReactDOM from "react-dom"
import * as antd from "antd"
import { Card, Mask } from "antd-mobile"

import { Icons } from "components/Icons"
import { DiReact } from "react-icons/di"

import config from "config"

import "./index.less"

export const AboutCard = (props) => {
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

	const isProduction = import.meta.env.PROD
	const isWSMainConnected = window.app.ws.mainSocketConnected
	const WSMainOrigin = app.ws.sockets.main.io.uri

	return <Mask visible={visible} onMaskClick={() => close()}>
		<div className="aboutApp_wrapper">
			<Card
				bodyClassName="aboutApp_card"
				headerClassName="aboutApp_card_header"
				title={
					<div className="content">
						<div className="branding">
							<h2>{config.app.siteName}</h2>
							<span>{config.author}</span>
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
					<h3><Icons.Globe />Server information</h3>
					<div>
						<antd.Tag color={isWSMainConnected ? "green" : "red"}><Icons.Cpu />{WSMainOrigin}</antd.Tag>
					</div>
				</div>
				<div className="group">
					<h3><Icons.GitMerge />Versions</h3>
					<div>
						<antd.Tag color="#ffec3d">eVite v{window.__eviteVersion ?? "experimental"}</antd.Tag>
						<antd.Tag color="#61DBFB"><DiReact /> v{React.version ?? "experimental"}</antd.Tag>
					</div>
				</div>
			</Card>
		</div>
	</Mask >
}

export function openModal() {
	const component = document.createElement("div")
	document.body.appendChild(component)

	const onClose = () => {
		ReactDOM.unmountComponentAtNode(component)
		document.body.removeChild(component)
	}

	ReactDOM.render(<AboutCard onClose={onClose} />, component)
}