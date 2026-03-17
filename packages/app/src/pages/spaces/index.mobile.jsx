import Icons from "@components/Icons"
import NavMenu from "@components/PagePanels/components/NavMenu"
import GroupsList from "@components/Spaces/GroupList"
import DMView from "./dm"

import "./index.less"

const SpacesPage = () => {
	if (!app.userData || !app.userData.flags.includes("spaces_preview")) {
		app.navigation.goMain()
		return null
	}

	//const page = React.useContext(SpacesPageContext)
	const [activeKey, setActiveKey] = React.useState("groups")

	const onTopBarItemClick = (key) => {
		setActiveKey(key)
	}

	app.layout.top_bar.render(
		<NavMenu
			onClickItem={onTopBarItemClick}
			items={[
				{ key: "groups", icon: <Icons.Rows3 /> },
				{ key: "direct-messages", icon: <Icons.MessagesSquare /> },
			]}
		/>,
	)

	return (
		<div className="spaces-page">
			{activeKey === "groups" && (
				<GroupsList
					onClickItem={(item) => {
						// page.setType("group")
						// page.setRoom(item._id)
						app.location.push(`/spaces/group/${item._id}`)
					}}
				/>
			)}
			{activeKey === "direct-messages" && <DMView />}
		</div>
	)
}

SpacesPage.options = {
	layout: {
		type: "spaces",
		centeredContent: false,
		maxHeight: true,
	},
}

export default SpacesPage
