import React from "react"
import { motion } from "motion/react"
import classnames from "classnames"
import { Icons } from "@components/Icons"

import config from "@config"

import { authorizedItems } from "@layouts/components/sidebar"
import SidebarItemsClickHandlers from "@layouts/components/sidebar/itemClickHandlers"

import GroupsList from "../GroupList"

import SpacesPageContext from "@pages/spaces/contexts/page"

import "./index.less"

const SpacesSidebar = () => {
	const { type, room, setType, setRoom, setChannel } =
		React.useContext(SpacesPageContext)

	const onClickBottomItem = (item) => {
		if (item.key === "dm") {
			setType("dm")
			setRoom(null)
			setChannel(null)
		}
	}

	const onClickGroupListItem = (group) => {
		setType("group")
		setRoom(group._id)
		setChannel(null)
	}

	return (
		<motion.div className="spaces-page__sidebar bg-accent">
			<div className="spaces-page__sidebar__section">
				<div className="spaces-page__sidebar__section__header">
					<img
						src={config.logo?.alt}
						onClick={() => app.navigation.goMain()}
						className="spaces-page__sidebar__section__header__logo"
					/>
				</div>

				<GroupsList
					selected={type === "group" ? room : null}
					onClickItem={onClickGroupListItem}
				/>
			</div>

			<SpacesSidebarBottomItems onClickItem={onClickBottomItem} />
		</motion.div>
	)
}

const SpacesSidebarBottomItems = ({ onClickItem }) => {
	const otherItems = React.useMemo(
		() =>
			authorizedItems({
				onClickDropdownItem: (item) => {
					SidebarItemsClickHandlers[item.key]?.(item)
				},
				onDropdownOpenChange: () => {},
			}),
		[],
	)

	return (
		<div
			className="spaces-page__sidebar__section"
			style={{
				marginTop: "auto",
				gap: "5px",
			}}
		>
			<div
				id="dm-button"
				className={classnames("group-list__item", "bg-accent")}
				onClick={() => {
					onClickItem({
						key: "dm",
					})
				}}
			>
				<div
					className="group-list__item__icon"
					style={{
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Icons.MessageCircle
						style={{
							fontSize: "1rem",
						}}
					/>
				</div>

				<div className="group-list__item__content">
					<h3>Direct messages</h3>
				</div>
			</div>

			<div
				id="search-space-button"
				className={classnames("group-list__item", "bg-accent")}
			>
				<div
					className="group-list__item__icon"
					style={{
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Icons.Search
						style={{
							fontSize: "1rem",
						}}
					/>
				</div>

				<div className="group-list__item__content">
					<h3>Search on spaces</h3>
				</div>
			</div>

			{otherItems.map((item) => {
				return (
					<div
						key={item.key}
						className={classnames(
							"group-list__item-other",
							"bg-accent",
						)}
					>
						{item.label}
					</div>
				)
			})}
		</div>
	)
}

export default SpacesSidebar
