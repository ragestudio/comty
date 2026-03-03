import React from "react"
import { AnimatePresence } from "motion/react"

import GenerateMenuItems from "@utils/generateMenuItems"
import useLayoutInterface from "@hooks/useLayoutInterface"

import TopMenuItems from "@config/sidebar/TopItems"
import BottomMenuItems from "@config/sidebar/BottomItems"

import ItemsClickHandlers from "./itemClickHandlers"

import SidebarInner from "./inner"

import "./index.less"

const Sidebar = () => {
	const [visible, setVisible] = React.useState(false)
	const [expanded, setExpanded] = React.useState(false)
	const [topItems, setTopItems] = React.useState(() =>
		GenerateMenuItems(TopMenuItems),
	)
	const [bottomItems, setBottomItems] = React.useState(() =>
		GenerateMenuItems(BottomMenuItems),
	)
	const [selectedMenuItem, setSelectedMenuItem] = React.useState(null)
	const [dropdownOpen, setDropdownOpen] = React.useState(false)

	const collapseDebounceRef = React.useRef(null)

	const calculateSelectedMenuItem = React.useCallback(
		(path) => {
			const items = [...topItems, ...bottomItems]

			setSelectedMenuItem(
				items.find((item) => String(path).includes(item.path)),
			)
		},
		[topItems, bottomItems],
	)

	const getMenuItemGroupStateKey = React.useCallback((group) => {
		switch (group) {
			case "top": {
				return "topItems"
			}
			case "bottom": {
				return "bottomItems"
			}
			default: {
				return null
			}
		}
	}, [])

	const addMenuItem = React.useCallback(
		(group, item) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				const newItems = [...prev, item]
				return newItems
			})
		},
		[getMenuItemGroupStateKey],
	)

	const removeMenuItem = React.useCallback(
		(group, id) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				const newItems = prev.filter((item) => item.id !== id)
				return newItems
			})
		},
		[getMenuItemGroupStateKey],
	)

	const updateMenuItemProps = React.useCallback(
		(group, id, newProps) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				return prev.map((item) => {
					if (item.id === id) {
						return {
							...item,
							props: {
								...item.props,
								...newProps,
							},
						}
					}
					return item
				})
			})
		},
		[getMenuItemGroupStateKey],
	)

	const toggleExpanded = React.useCallback(
		(to) => {
			to = to ?? !expanded

			setExpanded(to)

			app.layout.toggleRootContainerClassname("sidebar-expanded", to)

			app.eventBus.emit("sidebar.expanded", to)
		},
		[expanded, dropdownOpen],
	)

	const toggleVisibility = React.useCallback(
		(to) => {
			if (to === false) {
				toggleExpanded(false, {
					instant: true,
				})
			}

			setVisible((prev) => to ?? !prev)
		},
		[toggleExpanded],
	)

	// create the layout interface
	useLayoutInterface("sidebar", {
		toggleVisibility,
		toggleExpanded,
		isVisible: () => visible,
		isExpanded: () => expanded,
		updateMenuItemProps,
		addMenuItem,
		removeMenuItem,
	})

	// Event handlers
	const handleClick = React.useCallback(
		(e) => {
			if (e.item.props.ignore_click === "true") {
				return
			}

			if (e.item.props.override_event) {
				return app.eventBus.emit(
					e.item.props.override_event,
					e.item.props.override_event_props,
				)
			}

			if (typeof e.key === "undefined") {
				app.eventBus.emit("invalidSidebarKey", e)
				return false
			}

			if (typeof ItemsClickHandlers[e.key] === "function") {
				return ItemsClickHandlers[e.key](e)
			}

			app.cores.sfx.play("sidebar.switch_tab")

			let item = [...topItems, ...bottomItems].find(
				(item) => item.id === e.key,
			)

			return app.location.push(`/${item.path ?? e.key}`, 150)
		},
		[topItems, bottomItems],
	)

	const handleMouseEnter = React.useCallback(() => {
		if (!visible || app.layout.drawer.isMaskVisible() || dropdownOpen) {
			return false
		}

		if (collapseDebounceRef.current) {
			clearTimeout(collapseDebounceRef.current)
			collapseDebounceRef.current = null
		}

		return toggleExpanded(true)
	}, [visible, toggleExpanded])

	const handleMouseLeave = React.useCallback(() => {
		if (!visible || dropdownOpen) {
			return false
		}

		if (collapseDebounceRef.current) {
			clearTimeout(collapseDebounceRef.current)
			collapseDebounceRef.current = null
		}

		// create the timeout
		collapseDebounceRef.current = setTimeout(
			() => toggleExpanded(false),
			window.app.cores.settings.get("sidebar.collapse_delay_time") ?? 500,
		)
	}, [visible, dropdownOpen, toggleExpanded])

	const onDropdownOpenChange = React.useCallback(
		(to) => {
			if (!to && expanded) {
				toggleExpanded(false)
			}

			setDropdownOpen(to)
		},
		[expanded, toggleExpanded],
	)

	const onClickDropdownItem = React.useCallback((item) => {
		const handler = ItemsClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}, [])

	// Initialize
	React.useEffect(() => {
		calculateSelectedMenuItem(app.location.pathname)

		setTimeout(() => {
			toggleVisibility(true)
		}, 10)

		const events = {
			"router.navigate": (path) => {
				calculateSelectedMenuItem(path)
			},
			"authmanager:authed": () => {
				// recalculate sidebar items
				setTopItems(GenerateMenuItems(TopMenuItems))
				setBottomItems(GenerateMenuItems(BottomMenuItems))
			},
		}

		for (const [event, handler] of Object.entries(events)) {
			app.eventBus.on(event, handler)
		}

		return () => {
			for (const [event, handler] of Object.entries(events)) {
				app.eventBus.off(event, handler)
			}
		}
	}, [])

	return (
		<AnimatePresence propagate>
			{visible && (
				<SidebarInner
					expanded={expanded}
					topItems={topItems}
					bottomItems={bottomItems}
					selectedMenuItem={selectedMenuItem}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					onHandleClick={handleClick}
					onDropdownOpenChange={onDropdownOpenChange}
					onClickDropdownItem={onClickDropdownItem}
					dropdownOpen={dropdownOpen}
				/>
			)}
		</AnimatePresence>
	)
}

export default Sidebar
