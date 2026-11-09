import * as antd from "antd"

import InfoField from "./InfoField"
import { Icons } from "@components/Icons"
import client from "comty.js/core/client"

import { openDialog as openChangeOriginDialog } from "@/components/ChangeOriginDialog"

const tooltipStrings = {
	secure: "This connection is secure",
	insecure:
		"This connection is insecure, cause it's not using HTTPS protocol and the server cannot be verified on the trusted certificate authority.",
}

export interface OriginFieldProps {
	secure: boolean
}

export function OriginField({ secure }: OriginFieldProps) {
	return (
		<InfoField
			icon={<Icons.EthernetPort />}
			label="Origin"
			headerExtra={
				<antd.Tooltip
					title={secure ? tooltipStrings.secure : tooltipStrings.insecure}
				>
					<antd.Tag
						color={secure ? "green" : "red"}
						icon={secure ? <Icons.LockKeyhole /> : <Icons.TriangleAlert />}
					>
						{secure ? "Secure connection" : "Insecure connection"}
					</antd.Tag>
				</antd.Tooltip>
			}
		>
			<div className="origin_field">
				<code onClick={openChangeOriginDialog}>{client.origin}</code>
			</div>
		</InfoField>
	)
}

export default OriginField
