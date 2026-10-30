import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "@components/Icons"
import { getCurrentKeyValue } from "@hooks/useUrlQueryActiveKey"

import { useHeaderStore } from "@/stores/header"
import { setTopBarRender, useTopBarStore } from "@/stores/topbar"
import { usePagePanelsStore } from "@/stores/pagePanels"

import NavMenu from "./components/NavMenu"
import type { NavMenuItem } from "./components/NavMenu"

import "./index.less"

export type PagePanelIcon = React.ReactNode | string

export interface PagePanelTabItem {
	key: string
	label?: React.ReactNode
	icon?: PagePanelIcon
	children?: PagePanelTabItem[]
	disabled?: boolean
	props?: Record<string, any>
	component?: React.ComponentType<any>
}

export interface PagePanelWithNavMenuProps {
	tabs?: PagePanelTabItem[]
	extraItems?: PagePanelTabItem[]
	navMenuHeader?: React.ReactNode
	defaultTab?: string
	tabProps?: Record<string, any>
	onNotFound?: () => React.ReactNode
	beforeTabChange?: (key: string) => void | Promise<void>
	onTabChange?: (key: string) => void
	useSetQueryType?: boolean
	transition?: boolean
	masked?: boolean
	primaryPanelClassName?: string
}

export class Tab extends React.Component<
	{ children?: React.ReactNode },
	{ error: Error | null }
> {
	state: { error: Error | null } = {
		error: null,
	}

	componentDidCatch(error: Error) {
		this.setState({ error })
	}

	render() {
		if (this.state.error) {
			return (
				<antd.Result
					status="error"
					title="Error"
					subTitle={this.state.error.message}
				/>
			)
		}

		return <>{this.props.children}</>
	}
}

export interface PanelProps {
	props?: Record<string, any>
	align?: "left" | "center" | "right"
	className?: string
	children?: React.ReactNode
}

export const Panel = (props: PanelProps) => {
	return (
		<div
			{...(props.props ?? {})}
			className={classnames("panel", props.align, props.className)}
		>
			{props.children}
		</div>
	)
}

const getItems = (items: PagePanelTabItem[]): NavMenuItem[] => {
	return items.map((item) => ({
		key: item.key,
		icon: createIconRender(item.icon),
		label: item.label,
		children: item.children ? getItems(item.children) : undefined,
		disabled: item.disabled,
		props: item.props ?? {},
	}))
}

const findActiveTab = (
	tabs: PagePanelTabItem[],
	activeKey: string,
): PagePanelTabItem | null => {
	const directory = activeKey.split(".")

	let currentTabs: PagePanelTabItem[] | undefined = tabs

	for (let index = 0; index < directory.length; index++) {
		const key = directory[index]
		const current = currentTabs?.find((tab) => tab.key === key)

		if (!current) {
			return null
		}

		if (index === directory.length - 1) {
			return current
		}

		currentTabs = current.children
	}

	return null
}

const replaceQueryTypeToCurrentTab = (key: string) => {
	if (app.isDesktop) {
		return history.pushState({ type: key }, "")
	}

	return history.pushState(undefined, "", `?type=${key}`)
}

export const PagePanelWithNavMenu = (props: PagePanelWithNavMenuProps) => {
	const tabs = props.tabs ?? []

	const [activeTab, setActiveTab] = React.useState<string | undefined>(
		() => getCurrentKeyValue("type") ?? props.defaultTab ?? tabs[0]?.key,
	)

	const renders = usePagePanelsStore((state) => state.renders)

	const primaryPanelRef = React.useRef<HTMLDivElement>(null)

	const navMenuItems = React.useMemo(
		() => getItems([...tabs, ...(props.extraItems ?? [])]),
		[tabs, props.extraItems],
	)

	const mobileNavMenuItems = React.useMemo(() => getItems(tabs), [tabs])

	React.useEffect(() => {
		if (app.isMobile) {
			useTopBarStore.getState().setUseSpacer(true)
			app.layout.toggleCenteredContent(false)
		} else {
			app.layout.toggleCenteredContent(true)
		}

		return () => {
			usePagePanelsStore.getState().clearComponents()

			if (app.isMobile) {
				useTopBarStore.getState().clearRender()
			} else {
				useHeaderStore.getState().setRender(null)
			}
		}
	}, [])

	const tabChange = React.useCallback(
		async (key: string) => {
			if (props.beforeTabChange) {
				await props.beforeTabChange(key)
			}

			setActiveTab(key)

			if (props.useSetQueryType) {
				replaceQueryTypeToCurrentTab(key)
			}

			if (props.onTabChange) {
				props.onTabChange(key)
			}
		},
		[props.beforeTabChange, props.useSetQueryType, props.onTabChange],
	)

	const handleTabChange = React.useCallback(
		async (key: string) => {
			if (activeTab === key) return

			if (props.transition) {
				const startViewTransition = (document as any).startViewTransition

				if (startViewTransition) {
					startViewTransition.call(document, () => {
						tabChange(key)
					})

					return
				}

				console.warn(
					"PagePanelWithNavMenu: transition is enabled but document.startViewTransition is not compatible with your browser",
				)

				if (primaryPanelRef.current?.classList) {
					primaryPanelRef.current.classList.add("fade-opacity-leave")

					setTimeout(() => {
						primaryPanelRef.current?.classList.remove("fade-opacity-leave")
					}, 300)
				}

				await new Promise((resolve) => setTimeout(resolve, 200))
			}

			return tabChange(key)
		},
		[activeTab, props.transition, tabChange],
	)

	React.useEffect(() => {
		if (app.isMobile) {
			if (mobileNavMenuItems.length > 0) {
				setTopBarRender(
					<NavMenu
						activeKey={activeTab}
						items={mobileNavMenuItems}
						onClickItem={handleTabChange}
					/>,
				)
			} else {
				useTopBarStore.getState().clearRender()
			}

			return
		}

		if (navMenuItems.length > 0 || renders.length > 0 || props.navMenuHeader) {
			useHeaderStore.getState().setRender(
				<NavMenu
					header={props.navMenuHeader}
					activeKey={activeTab}
					items={navMenuItems}
					onClickItem={handleTabChange}
					renderNames
				>
					{renders.map((renderItem) =>
						React.createElement(renderItem.component, {
							...(renderItem.options.props ?? {}),
							key: renderItem.id,
						}),
					)}
				</NavMenu>,
			)
		} else {
			useHeaderStore.getState().setRender(null)
		}
	}, [
		activeTab,
		navMenuItems,
		mobileNavMenuItems,
		renders,
		props.navMenuHeader,
		handleTabChange,
	])

	const renderActiveTab = () => {
		if (tabs.length === 0 && !activeTab) {
			return <></>
		}

		if (!activeTab) {
			if (tabs[0]?.key) {
				console.error("PagePanelWithNavMenu: activeTab is not defined")

				return (
					<antd.Result
						status="404"
						title="404"
						subTitle="Sorry, the tab you visited does not exist (activeTab not set)."
					/>
				)
			}

			return <></>
		}

		const tab = findActiveTab(tabs, activeTab)

		if (!tab) {
			if (props.onNotFound) {
				return props.onNotFound()
			}

			return (
				<antd.Result
					status="404"
					title="404"
					subTitle="Sorry, the tab you visited does not exist."
				/>
			)
		}

		if (!tab.component) {
			return <></>
		}

		const componentProps = tab.props ?? props.tabProps

		return React.createElement(tab.component, {
			...componentProps,
		})
	}

	return (
		<div className={classnames("pagePanels", { masked: props.masked })}>
			<div
				className={classnames("panel", props.primaryPanelClassName)}
				ref={primaryPanelRef}
			>
				{renderActiveTab()}
			</div>
		</div>
	)
}

export default PagePanelWithNavMenu
