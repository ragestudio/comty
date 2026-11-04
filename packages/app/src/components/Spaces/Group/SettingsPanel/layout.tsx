import type { CSSProperties, ReactNode } from "react"
import classNames from "clsx"

import createBem from "@/utils/createBem"
import styles from "./layout.module.less"

export const base = createBem("group-settings", styles)
export const b = createBem("group-settings-content", styles)

export const Settings = ({
	children,
	row,
}: {
	children: ReactNode
	row?: boolean
}) => {
	return <div className={base({ row: row })}>{children}</div>
}

export const SettingsContent = ({
	children,
	row,
}: {
	children: ReactNode
	row?: boolean
}) => {
	return <div className={classNames(b({ row: row }))}>{children}</div>
}

export const SettingsHeader = ({ children }: { children: ReactNode }) => {
	return <div className={classNames(b.elem("header"))}>{children}</div>
}

export const SettingsSection = ({
	children,
	style,
}: {
	children: ReactNode
	style?: CSSProperties
}) => {
	return (
		<div
			className={classNames(b.elem("section"), "bg-accent", "border-default")}
			style={style}
		>
			{children}
		</div>
	)
}

export const SettingsSectionField = ({
	children,
	row,
}: {
	children: ReactNode
	row?: boolean
}) => {
	return (
		<div className={classNames(b.elem("section__field", { row: row }))}>
			{children}
		</div>
	)
}

export const SettingsSectionFieldLabel = ({
	children,
}: {
	children: ReactNode
}) => {
	return (
		<div className={classNames(b.elem("section__field__label"))}>
			{children}
		</div>
	)
}

export const SettingsSectionFieldContent = ({
	children,
}: {
	children: ReactNode
}) => {
	return (
		<div className={classNames(b.elem("section__field__content"))}>
			{children}
		</div>
	)
}
