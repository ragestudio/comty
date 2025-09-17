import { Icons } from "@components/Icons"
import { PagePanelWithNavMenu } from "@components/PagePanels"

import Tabs from "./tabs"

const NavMenuHeader = (
	<h2>
		<Icons.SquareLibrary />
		Music
	</h2>
)

const MusicPage = () => {
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

export default MusicPage
