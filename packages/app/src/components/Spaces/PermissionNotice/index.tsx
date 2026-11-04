import React from "react"
import classNames from "clsx"

import { Icons } from "@components/Icons"

import "./index.less"

export type PermissionNoticeProps = {
	title?: string
	description?: string
	compact?: boolean
	centered?: boolean
}

const PermissionNotice = ({
	title = "Missing permissions",
	description,
	compact = false,
	centered = false,
}: PermissionNoticeProps) => {
	return (
		<div
			className={classNames("spaces-permission-notice", {
				["compact"]: compact,
				["centered"]: centered,
			})}
		>
			<Icons.Lock className="spaces-permission-notice__icon" />

			<div className="spaces-permission-notice__text">
				<strong>{title}</strong>
				{description && <span>{description}</span>}
			</div>
		</div>
	)
}

export default PermissionNotice
