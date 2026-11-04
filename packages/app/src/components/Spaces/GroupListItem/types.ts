import type { ReactNode, Ref } from "react"
import type { Group } from "@comty/shared/types/spaces/group"

export interface GroupListItemBaseProps {
	id?: string
	className?: string
	icon?: ReactNode
	image?: string | null
	title?: string | null
	description?: string | null
	selected?: boolean
	compact?: boolean
	onClick?: () => void
	elementRef?: Ref<HTMLDivElement>
	dataGroupId?: string
}

export interface GroupListItemProps {
	group: Group
	selected?: boolean
	compact?: boolean
	onClick?: (group: Group) => void
	elementRef?: Ref<HTMLDivElement>
	className?: string
}

export interface GroupListActionItemProps {
	icon: ReactNode
	title: string
	description?: string
	id?: string
	selected?: boolean
	compact?: boolean
	onClick?: () => void
	className?: string
}
