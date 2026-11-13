import type { ReactNode } from "react"

import { SettingsGroup, SettingsGroupHeader } from "@/pages/settings/layout"

import createBem from "@/utils/createBem"

import styles from "./inventorySection.module.less"

const section = createBem("inventory-section", styles)

interface InventorySectionProps {
	title: string
	icon?: ReactNode
	count?: number
	children: ReactNode
}

export const InventorySection = ({
	title,
	icon,
	count,
	children,
}: InventorySectionProps) => {
	return (
		<SettingsGroup>
			<SettingsGroupHeader>
				{icon}
				<h2>{title}</h2>

				{typeof count === "number" && (
					<span className={section.elem("count")}>{count}</span>
				)}
			</SettingsGroupHeader>

			{children}
		</SettingsGroup>
	)
}
