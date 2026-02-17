import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import LatencyIndicator from "@components/PerformanceIndicators/latency"
import SponsorsList from "@components/SponsorsList"

import config from "@config"

import "./index.less"

const connectionsTooltipStrings = {
	secure: "This connection is secure",
	insecure:
		"This connection is insecure, cause it's not using HTTPS protocol and the server cannot be verified on the trusted certificate authority.",
	warning:
		"This connection is secure but the server cannot be verified on the trusted certificate authority.",
}

export default {
	id: "about",
	icon: "Info",
	label: "About",
	group: "bottom",
	render: () => {
		const isProduction = import.meta.env.PROD

		const [serverManifest, setServerManifest] = React.useState(null)
		const [serverOrigin, setServerOrigin] = React.useState(null)
		const [secureConnection, setSecureConnection] = React.useState(false)
		const [capInfo, setCapInfo] = React.useState(null)

		const checkServerVersion = async () => {
			const serverManifest = await app.cores.api.customRequest()

			setServerManifest(serverManifest.data)
		}

		const checkServerOrigin = async () => {
			const instance = app.cores.api.client()

			if (instance) {
				setServerOrigin(instance.mainOrigin)

				if (instance.mainOrigin.startsWith("https")) {
					setSecureConnection(true)
				}
			}
		}

		React.useEffect(() => {
			checkServerVersion()
			checkServerOrigin()
		}, [])

		return (
			<div className="about_app">
				<div className="header">
					<div className="branding">
						<div className="logo">
							<img
								src={config.logo.alt}
								alt="Logo"
							/>
						</div>
						<div className="texts">
							<div className="sitename-text">
								<h2>{config.app.siteName}</h2>
							</div>
							<span>{config.author}</span>
							<span>
								Licensed with{" "}
								{config.package?.license ?? "unlicensed"}{" "}
							</span>
						</div>
					</div>
					<div className="versions">
						<antd.Tag>
							<Icons.Tag />v{window.app.version ?? "experimental"}
						</antd.Tag>
						<antd.Tag color={isProduction ? "green" : "magenta"}>
							{isProduction ? (
								<Icons.CircleCheck />
							) : (
								<Icons.Triangle />
							)}
							{String(import.meta.env.MODE)}
						</antd.Tag>
					</div>
				</div>

				<div className="group">
					<div className="group_header">
						<h3>
							<Icons.Info />
							Server information
						</h3>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.EthernetPort />
							</div>
							<p>Origin</p>

							<antd.Tooltip
								title={
									secureConnection
										? connectionsTooltipStrings.secure
										: connectionsTooltipStrings.insecure
								}
							>
								<antd.Tag
									color={secureConnection ? "green" : "red"}
									icon={
										secureConnection ? (
											<Icons.LockKeyhole />
										) : (
											<Icons.TriangleAlert />
										)
									}
								>
									{secureConnection
										? " Secure connection"
										: "Insecure connection"}
								</antd.Tag>
							</antd.Tooltip>
						</div>

						<div className="field_value">
							{serverOrigin ?? "Unknown"}
						</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Unplug />
							</div>
							<p>Connection</p>
						</div>

						<div className="field_value">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									fontSize: "1.4rem",
									justifyContent: "space-evenly",
									width: "100%",
								}}
							>
								<LatencyIndicator type="http" />

								<LatencyIndicator type="ws" />
							</div>
						</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Wrench />
							</div>

							<p>Version</p>
						</div>

						<div className="field_value">
							{serverManifest?.version ?? "Unknown"}
						</div>
					</div>
				</div>

				<SponsorsList />

				<div className="group">
					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Layers />
							</div>

							<p>Platform</p>
						</div>

						<div className="field_value">Web App</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Cog />
							</div>

							<p>Engine</p>
						</div>

						<div className="field_value">
							{app.__version ?? "Unknown"}
						</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.SiReact />
							</div>

							<p>React</p>
						</div>

						<div className="field_value">
							{React.version ?? "Unknown"}
						</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.SiAntdesign />
							</div>

							<p>UI</p>
						</div>

						<div className="field_value">
							{antd.version ?? "Unknown"}
						</div>
					</div>

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Package />
							</div>

							<p>Comty.js</p>
						</div>

						<div className="field_value">
							{__comty_shared_state.version ?? "Unknown"}
						</div>
					</div>

					{capInfo && (
						<div className="inline_field">
							<div className="field_header">
								<div className="field_icon">
									<Icons.Info />
								</div>

								<p>App ID</p>
							</div>

							<div className="field_value">{capInfo.id}</div>
						</div>
					)}

					{capInfo && (
						<div className="inline_field">
							<div className="field_header">
								<div className="field_icon">
									<Icons.Info />
								</div>

								<p>App Build</p>
							</div>

							<div className="field_value">{capInfo.build}</div>
						</div>
					)}

					{capInfo && (
						<div className="inline_field">
							<div className="field_header">
								<div className="field_icon">
									<Icons.Info />
								</div>

								<p>App Version</p>
							</div>

							<div className="field_value">{capInfo.version}</div>
						</div>
					)}

					<div className="inline_field">
						<div className="field_header">
							<div className="field_icon">
								<Icons.Scale />
							</div>

							<p>View Open Source Licenses</p>
						</div>

						<div className="field_value">
							<antd.Button
								icon={<Icons.SquareArrowOutUpRight />}
								onClick={() => app.location.push("/licenses")}
							/>
						</div>
					</div>
				</div>
			</div>
		)
	},
}
