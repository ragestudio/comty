import * as antd from "antd"

import { Icons } from "@components/Icons"
import config from "@config"

declare const app: any

export function BrandingHeader() {
	const isProduction = import.meta.env.PROD

	return (
		<div className="header bg-accent">
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

					<span>Licensed with {config.package?.license ?? "unlicensed"}</span>
				</div>
			</div>

			<div className="versions">
				<antd.Tag icon={<Icons.Tag />}>
					v{app.version ?? "experimental"}
				</antd.Tag>

				<antd.Tag
					color={isProduction ? "green" : "magenta"}
					icon={isProduction ? <Icons.CircleCheck /> : <Icons.Triangle />}
				>
					{String(import.meta.env.MODE)}
				</antd.Tag>
			</div>
		</div>
	)
}

export default BrandingHeader
