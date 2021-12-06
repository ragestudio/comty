import React from "react"
import ReactDOM from "react-dom"

import * as antd from "antd"
import { Icons } from "components/Icons"
import config from "config"

import "./index.less"

export class AboutCard extends React.Component {
	state = {
		visible: true,
	}

	onClose = () => {
		this.setState({ visible: false })

		if (typeof this.props.onClose === "function") {
			this.props.onClose()
		}
	}

	render() {
		const eviteNamespace = window.__evite
		const appConfig = config.app ?? {}
		const isDevMode = eviteNamespace.env.NODE_ENV !== "production"

		return (
			<antd.Modal
				destroyOnClose
				onCancel={this.onClose}
				visible={this.state.visible}
				centered
				footer={false}
				width="80%"
			>
				<div className="about_app_wrapper">
					<div className="about_app_header">
						<div>
							<img src={config.logo.alt} />
						</div>
						<div>
							<h1>{appConfig.siteName}</h1>
							<div>
								<antd.Tag>
									<Icons.Tag />v{eviteNamespace.projectVersion}
								</antd.Tag>
								<antd.Tag color="geekblue">eVite v{eviteNamespace.eviteVersion}</antd.Tag>
								<antd.Tag color="green">
									<Icons.Hexagon /> v{eviteNamespace.versions.node}
								</antd.Tag>

								<antd.Tag color={isDevMode ? "magenta" : "green"}>
									{isDevMode ? <Icons.Triangle /> : <Icons.CheckCircle />}
									{isDevMode ? "development" : "stable"}
								</antd.Tag>
							</div>
						</div>
					</div>
					<div className="about_app_info"></div>
				</div>
			</antd.Modal>
		)
	}
}

export function openModal() {
	const component = document.createElement("div")
	document.body.appendChild(component)

	ReactDOM.render(<AboutCard />, component)
}
