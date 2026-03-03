import React from "react"
import { motion } from "motion/react"
import classNames from "classnames"
import { Icons } from "@components/Icons"

import config from "@config"

import { authorizedItems } from "@layouts/components/sidebar/inner"
import SidebarItemsClickHandlers from "@layouts/components/sidebar/itemClickHandlers"

import GroupsList from "../GroupList"

import SpacesPageContext from "@contexts/WithSpaces/page"

import "./index.less"

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

	const onClickCreateNewGroup = () => {}

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

	const onClickSearch = React.useCallback(() => {
		app.location.push("/spaces/search")
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

			{otherItems.map((item) => {
				return (
					<div
						key={item.key}
						className={classNames(
							"group-list__item-other",
							"bg-accent",
						)}
					>
						{item.icon ?? item.label}
					</div>
				)
			})}
		</div>
	)
}

export default SpacesSidebar
