import type {
	GroupListItemBaseProps,
	GroupListItemProps,
	GroupListActionItemProps,
} from "./types"

import classnames from "classnames"

import { Icons } from "@components/Icons"

import GroupListItemIcon from "./Icon"
import GroupListItemContent from "./Content"

import "./index.less"

export const GroupListItemBase = ({
	id,
	className,
	icon,
	image,
	title,
	description,
	selected,
	compact,
	onClick,
	elementRef,
	dataGroupId,
}: GroupListItemBaseProps) => {
	return (
		<div
			ref={elementRef}
			id={id}
			className={classnames("group-list__item", "bg-accent", className, {
				["selected"]: selected,
				["compact"]: compact,
			})}
			onClick={onClick}
			data-group-id={dataGroupId}
		>
			<GroupListItemIcon
				image={image}
				icon={icon}
			/>

			<GroupListItemContent
				title={title}
				description={description}
			/>
		</div>
	)
}

export const GroupListItem = ({
	group,
	selected,
	compact,
	onClick,
	elementRef,
	className,
}: GroupListItemProps) => {
	return (
		<GroupListItemBase
			elementRef={elementRef}
			dataGroupId={group._id}
			image={group.icon}
			icon={group.icon ? undefined : <Icons.Birdhouse />}
			title={group.name}
			description={group.description}
			selected={selected}
			compact={compact}
			onClick={onClick ? () => onClick(group) : undefined}
			className={classnames("group-list__item__group", className)}
		/>
	)
}

export const GroupListActionItem = ({
	icon,
	title,
	description,
	id,
	selected,
	compact,
	onClick,
	className,
}: GroupListActionItemProps) => {
	return (
		<GroupListItemBase
			id={id}
			icon={icon}
			title={title}
			description={description}
			selected={selected}
			compact={compact}
			onClick={onClick}
			className={className}
		/>
	)
}

export type {
	GroupListItemBaseProps,
	GroupListItemProps,
	GroupListActionItemProps,
}

export default GroupListItem
