import * as antd from "antd"

import { Icons } from "@components/Icons"

import { useSetting } from "@/pages/settings/hooks/useSetting"

import { APP_CHANNELS, type AppChannel } from "../channel"
import { appChannelSetting } from "../settings"
import type { AboutContext } from "../types"

import InfoField from "./InfoField"

export interface ChannelFieldProps {
	ctx: AboutContext
}

export function ChannelField({ ctx }: ChannelFieldProps) {
	const { value, loading, itemCtx } = useSetting(appChannelSetting, ctx)

	return (
		<InfoField
			icon={<Icons.Command />}
			label={appChannelSetting.title ?? "Release channel"}
		>
			<antd.Select
				value={value ?? undefined}
				disabled={loading}
				loading={loading}
				options={[...APP_CHANNELS]}
				onChange={(channel: AppChannel) => {
					void itemCtx.onUpdateItem(channel)
				}}
				style={{ minWidth: 160 }}
			/>
		</InfoField>
	)
}

export default ChannelField
