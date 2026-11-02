import classNames, { type ClassValue } from "clsx"

import VoiceChannelCard from "@/components/Spaces/VoiceChannelCard"
import { useRTCStore } from "@comty/spaces-sdk/rtc"
import ToolsBar from "@components/Spaces/ToolsBar"

import styles from "./index.module.less"

export const BasePanel = ({
	children,
	className,
}: {
	children: any
	className?: ClassValue
}) => {
	return (
		<div className={classNames("bg-accent", styles.panel, className)}>
			{children}
		</div>
	)
}

export const BaseLeftPanel = ({ children }) => {
	const rtcState = useRTCStore((s) => s.state)

	return (
		<BasePanel className={classNames(styles.left_panel)}>
			{children}

			<div className={classNames(styles.panel__attached)}>
				{rtcState !== "disconnected" && <VoiceChannelCard />}
			</div>
		</BasePanel>
	)
}

export const BaseRightPanel = ({ children }) => {
	return (
		<BasePanel className={classNames(styles.right_panel)}>
			{children}

			<div className={classNames(styles.panel__attached)}>
				<ToolsBar filters={["mediartc-channel"]} />
			</div>
		</BasePanel>
	)
}
