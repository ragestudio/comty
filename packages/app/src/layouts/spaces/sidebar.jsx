import React from "react"
import { motion } from "motion/react"
import classNames from "classnames"
import { Icons } from "@components/Icons"

import config from "@config"

import { authorizedItems } from "@layouts/components/sidebar/inner"
import SidebarItemsClickHandlers from "@layouts/components/sidebar/itemClickHandlers"

import GroupsList from "@components/Spaces/GroupList"
import SpacesPageContext from "@contexts/WithSpaces/page"

import QuickSettings from "./quickSettings"

import "./sidebar.less"

const SpacesSidebar = () => {
	const { type, room } = React.useContext(SpacesPageContext)

	const [compact, setCompact] = React.useState(false)

	React.useEffect(() => {
		if (type !== null) {
			setCompact(true)
		} else {
			setCompact(false)
		}
	}, [type])

	const onClickGroupListItem = (group) => {
		app.location.push(`/spaces/group/${group._id}`)
	}

	const onClickCreateNewGroup = () => {
		app.location.push(`/spaces/new`)
	}

	return (
		<div className="spaces-page__sidebar-wrapper">
			<motion.div
				className={classNames("spaces-page__sidebar bg-accent", {
					collapsed: compact,
				})}
			>
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
						onClickCreateNew={onClickCreateNewGroup}
						sortable
					/>
				</div>

				<SpacesSidebarBottomItems />
			</motion.div>
		</div>
	)
}

const SpacesSidebarBottomItems = () => {
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

	const AccountButton = React.useMemo(() => {
		if (!otherItems) {
			return null
		}

		return otherItems.find((item) => item.key === "account")
	}, [otherItems])

	const onClickQuickSettings = React.useCallback(() => {
		app.layout.modal.open("QuickSettings", QuickSettings)
	}, [])

	const onClickSearch = React.useCallback(() => {
		app.controls.openSearcher()
	}, [])

	const onClickDM = React.useCallback(() => {
		app.location.push("/spaces/dm")
	}, [])

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
				className={classNames("group-list__item", "bg-accent")}
				onClick={onClickDM}
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
				className={classNames("group-list__item", "bg-accent")}
				onClick={onClickSearch}
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

			<div
				className={classNames("group-list__item", "bg-accent")}
				onClick={onClickQuickSettings}
			>
				<div
					className="group-list__item__icon"
					style={{
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Icons.Settings
						style={{
							fontSize: "1rem",
						}}
					/>
				</div>

				<div className="group-list__item__content">
					<h3>Settings</h3>
				</div>
			</div>

			<div className={classNames("group-list__item-other", "bg-accent")}>
				{AccountButton && React.cloneElement(AccountButton.label, {})}
			</div>
		</div>
	)
}

export default SpacesSidebar
