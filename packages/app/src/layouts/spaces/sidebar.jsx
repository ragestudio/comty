import React from "react"
import { Menu } from "antd"
import { motion } from "motion/react"
import classNames from "classnames"
import { Icons } from "@components/Icons"

import QuickSettings from "./quickSettings"
import { authorizedItems } from "@layouts/components/sidebar/inner"
import SidebarItemsClickHandlers from "@layouts/components/sidebar/itemClickHandlers"
import GroupsList from "@components/Spaces/GroupList"
import GenerateMenuItems from "@utils/generateMenuItems"

import TopMenuItems from "@config/sidebar/TopItems"

import { useNavigation } from "@comty/spaces-lib"
import config from "@config"

import "./sidebar.less"

const SpacesSidebar = () => {
	const [defaultItemsVisible, setDefaultItemsVisible] = React.useState(false)
	const [compact, setCompact] = React.useState(false)
	const autoHideDefaultItemsTimeout = React.useRef()

	const { type, room } = useNavigation()

	const defaultSidebarTopItems = React.useMemo(
		() => GenerateMenuItems(TopMenuItems),
		[],
	)

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

	const onClickHomeButton = () => {
		if (autoHideDefaultItemsTimeout.current) {
			clearTimeout(autoHideDefaultItemsTimeout.current)
		}

		autoHideDefaultItemsTimeout.current = setTimeout(() => {
			setDefaultItemsVisible(false)
		}, 4000)

		if (defaultItemsVisible) {
			app.navigation.goMain()
			clearTimeout(autoHideDefaultItemsTimeout.current)
		} else {
			setDefaultItemsVisible(true)
		}
	}

	const onDefaultMenuClick = (e) => {
		setDefaultItemsVisible(false)

		if (e.itemData.path) {
			app.location.push(`/${e.itemData.path ?? e.key}`, 150)
		}
	}

	return (
		<div className="spaces-page__sidebar-wrapper">
			<motion.div
				className={classNames("spaces-page__sidebar bg-accent", {
					collapsed: compact,
				})}
			>
				<div className="spaces-page__sidebar__header">
					<img
						src={config.logo?.alt}
						onClick={onClickHomeButton}
						className="spaces-page__sidebar__header__logo"
					/>
				</div>

				<div className="spaces-page__sidebar__section">
					{defaultItemsVisible && (
						<Menu
							mode="inline"
							onClick={onDefaultMenuClick}
							//selectedKeys={[selectedKeyId]}
							items={defaultSidebarTopItems}
						/>
					)}
					{!defaultItemsVisible && (
						<GroupsList
							compact={compact}
							selected={type === "group" ? room : null}
							onClickItem={onClickGroupListItem}
							onClickCreateNew={onClickCreateNewGroup}
							sortable
						/>
					)}
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
			className="spaces-page__sidebar__footer"
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
