import type { ReactNode } from "react"

import classNames from "clsx"

import createBem from "@/utils/createBem"

import styles from "./layout.module.less"

export const base = createBem("app-settings", styles)
export const b = createBem("app-settings-content", styles)

export const SettingsRoot = ({ children }: { children: ReactNode }) => {
	return <div className={base()}>{children}</div>
}

export const SettingsSearchHeader = ({ children }: { children: ReactNode }) => {
	return <div className={b.elem("search-header")}>{children}</div>
}

export const SettingsGroup = ({
	children,
	id,
}: {
	children: ReactNode
	id?: string
}) => {
	return (
		<div
			id={id}
			className={classNames(b.elem("group"), "bg-accent", "border-default")}
		>
			{children}
		</div>
	)
}

export const SettingsGroupHeader = ({ children }: { children: ReactNode }) => {
	return <div className={b.elem("group-header")}>{children}</div>
}

export const SettingsList = ({ children }: { children: ReactNode }) => {
	return <div className={b.elem("list")}>{children}</div>
}

export const SettingsLazySetting = () => {
	return <div className={b.elem("lazy-setting")} />
}

export const SettingsSearchSectionPlaceholder = () => {
	return <div className={b.elem("search-section-placeholder")} />
}
