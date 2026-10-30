import React from "react"
import classnames from "classnames"
import * as antd from "antd"
import Button from "@ui/Button"

import "./index.less"

export interface NavMenuItemProps {
	onClick?: () => void
	type?: "primary" | "ghost" | "default" | "dashed" | "link" | "text"
	[key: string]: any
}

export interface NavMenuItem {
	key: string
	icon?: React.ReactNode
	label?: React.ReactNode
	children?: NavMenuItem[]
	disabled?: boolean
	props?: NavMenuItemProps
}

export interface NavMenuProps {
	activeKey?: string
	items: NavMenuItem[]
	onClickItem?: (key: string) => void
	renderNames?: boolean
	header?: React.ReactNode
	children?: React.ReactNode
}

const NavMenu = (props: NavMenuProps) => {
	function handleClickItem(item: NavMenuItem) {
		if (item.children && Array.isArray(item.children)) {
			return false
		}

		return props.onClickItem?.(item.key)
	}

	return (
		<>
			<div className={classnames("navmenu_wrapper")}>
				{props.items.map((item) => {
					if (!item.disabled && item.children && Array.isArray(item.children)) {
						return (
							<antd.Dropdown
								trigger={["click"]}
								menu={{
									items: item.children as any,
									onClick: (menuItem) => {
										handleClickItem(menuItem as NavMenuItem)
									},
								}}
							>
								<Button
									key={item.key}
									className={classnames(
										"navmenu_item",
										item.key === props.activeKey && "active",
									)}
									type="ghost"
									disabled={item.disabled}
								>
									<div className="icon">{item.icon}</div>

									{props.renderNames && (
										<div className="label">
											<p>{item.label ?? item.key}</p>
										</div>
									)}
								</Button>
							</antd.Dropdown>
						)
					}

					return (
						<Button
							key={item.key}
							className={classnames(
								"navmenu_item",
								item.key === props.activeKey && "active",
							)}
							onClick={() => {
								if (typeof item.props?.onClick === "function") {
									return item.props.onClick()
								}

								return handleClickItem(item)
							}}
							type={item.props?.type ?? "ghost"}
							disabled={item.disabled}
						>
							<div className="icon">{item.icon}</div>

							{props.renderNames && (
								<div className="label">
									<p>{item.label ?? item.key}</p>
								</div>
							)}
						</Button>
					)
				})}
			</div>

			{props.children}
		</>
	)
}

export default NavMenu
