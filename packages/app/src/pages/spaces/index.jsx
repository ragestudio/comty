import "./index.less"

// TODO: support url query key to auto select a room
// TODO: support room list pagination
// TODO: support hybrid group layout renderer
// TODO: improve group item design
// TODO: add support for mobile layout
// TODO: implement search logic
const SpacesPage = () => {
	if (!app.userData || !app.userData.flags.includes("spaces_preview")) {
		app.navigation.goMain()
		return null
	}

	return (
		<div>
			<h2>Spaces</h2>
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
