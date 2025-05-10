import React from "react"

import { Icons } from "@components/Icons"
import { PagePanelWithNavMenu } from "@components/PagePanels"

import useCenteredContainer from "@hooks/useCenteredContainer"

import Tabs from "./tabs"

const NavMenuHeader = (
	<h2>
		<Icons.MdAlbum />
		Music
	</h2>
)

export default () => {
	useCenteredContainer(false)

	return (
		<PagePanelWithNavMenu
			tabs={Tabs}
			navMenuHeader={NavMenuHeader}
			defaultTab="explore"
			primaryPanelClassName="full"
			useSetQueryType
			transition
		/>
	)
}
