import { Translation } from "react-i18next"

import { PagePanelWithNavMenu } from "@components/PagePanels"

import TrendingsCard from "@components/TrendingsCard"
import FeaturedEvents from "@components/FeaturedEventsAnnouncements"

import usePageWidgets from "@hooks/usePageWidgets"
import Tabs from "./tabs"

const TimelinePage = () => {
	usePageWidgets([
		{
			id: "trendings",
			component: TrendingsCard,
		},
		{
			id: "featured_events",
			component: FeaturedEvents,
		},
	])

	return (
		<PagePanelWithNavMenu
			tabs={Tabs}
			extraItems={[
				{
					key: "create",
					icon: "CirclePlus",
					label: <Translation>{(t) => t("Create")}</Translation>,
					props: {
						type: "primary",
						onClick: app.controls.openPostCreator,
					},
				},
			]}
			onTabChange={() => {
				app.layout.scrollTo({
					top: 0,
				})
			}}
			useSetQueryType
			transition
			masked
		/>
	)
}

TimelinePage.options = {
	useTitle: "Timeline",
	layout: {
		centeredContent: true,
	},
}

export default TimelinePage
