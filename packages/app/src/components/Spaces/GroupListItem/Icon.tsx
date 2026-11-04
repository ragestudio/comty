import type { ReactNode } from "react"

import classnames from "classnames"

export interface GroupListItemIconProps {
	image?: string | null
	icon?: ReactNode
	className?: string
}

const GroupListItemIcon = ({
	image,
	icon,
	className,
}: GroupListItemIconProps) => {
	return (
		<div className={classnames("group-list__item__icon", className)}>
			{image ? (
				<img
					src={image}
					alt=""
				/>
			) : (
				icon
			)}
		</div>
	)
}

export default GroupListItemIcon
