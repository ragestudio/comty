import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import LatencyIndicator from "@components/PerformanceIndicators/latency"
import SponsorsList from "@components/SponsorsList"

import client from "comty.js/core/client"
import { version as spacesSdkVersion } from "@comty/spaces-sdk"

import AppVersions from "./AppVersions"
import BrandingHeader from "./BrandingHeader"
import ChannelField from "./ChannelField"
import InfoField from "./InfoField"
import InfoGroup from "./InfoGroup"
import OriginField from "./OriginField"

import type { AboutContext } from "../types"

declare const app: any

interface ServerManifest {
	version?: string
}

export interface AboutViewProps {
	ctx: AboutContext
}

export function AboutView({ ctx }: AboutViewProps) {
	const electronVersions = window.__ELECTRON__?.versions
	const [serverManifest, setServerManifest] =
		React.useState<ServerManifest | null>(null)
	const [secureConnection, setSecureConnection] = React.useState(false)

	React.useEffect(() => {
		let active = true

		client
			.instance("/")
			.then((response) => {
				if (active) {
					setServerManifest(response.data)
				}
			})
			.catch(() => {
				// server manifest is optional
			})

		setSecureConnection(client.origin.startsWith("https"))

		return () => {
			active = false
		}
	}, [])

	return (
		<div className="about_app">
			<BrandingHeader />

			<InfoGroup
				icon={<Icons.Info />}
				title="Server information"
			>
				<OriginField secure={secureConnection} />

				<InfoField
					icon={<Icons.Unplug />}
					label="Connection"
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							fontSize: "1.4rem",
						}}
					>
						<LatencyIndicator type="http" />
						<LatencyIndicator type="ws" />
					</div>
				</InfoField>

				<InfoField
					icon={<Icons.Wrench />}
					label="Version"
					value={serverManifest?.version ?? "Unknown"}
				/>
			</InfoGroup>

			{electronVersions && (
				<InfoGroup
					icon={<Icons.Command />}
					title="Application"
				>
					<ChannelField ctx={ctx} />

					<AppVersions versions={electronVersions} />
				</InfoGroup>
			)}

			<InfoGroup
				icon={<Icons.Layers />}
				title="Platform"
			>
				<InfoField
					icon={<Icons.Layers />}
					label="Platform"
				>
					{app.isDesktop ? "Desktop App" : "Web App"}
				</InfoField>

				<InfoField
					icon={<Icons.Cog />}
					label="Engine"
					value={app.__version ?? "Unknown"}
				/>

				<InfoField
					icon={<Icons.Package />}
					label="Spaces SDK"
					value={spacesSdkVersion ?? "Unknown"}
				/>

				<InfoField
					icon={<Icons.Package />}
					label="Comty.js"
					value={client.version ?? "Unknown"}
				/>

				<InfoField
					icon={<Icons.React />}
					label="React"
					value={React.version ?? "Unknown"}
				/>

				<InfoField
					icon={<Icons.Antd />}
					label="UI"
					value={antd.version ?? "Unknown"}
				/>

				<InfoField
					icon={<Icons.Scale />}
					label="View Open Source Licenses"
				>
					<antd.Button
						icon={<Icons.SquareArrowOutUpRight />}
						onClick={() => app.location.push("/licenses")}
					/>
				</InfoField>
			</InfoGroup>

			<SponsorsList />
		</div>
	)
}

export default AboutView
