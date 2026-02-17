import React from "react"
import classnames from "classnames"

import SpacesSidebar from "./components/Sidebar"
import Group from "./components/Group"
import DMRoomsList from "./components/DMRoomsList"
import DMRoom from "./components/DMRoom"

import SpacesPageContext from "./contexts/page"

import "./index.less"

const URL_PREFIX = "spaces"

const composePathname = ({ type, room, channel }) => {
	return (
		"/" + [URL_PREFIX, type, room, channel].filter((part) => part).join("/")
	)
}

const spacesPageController = () => {
	const [firstLoad, setFirstLoad] = React.useState(true)
	const [type, setType] = React.useState(null)
	const [room, setRoom] = React.useState(null)
	const [channel, setChannel] = React.useState(null)

	const updateToHistory = () => {
		const pathname = composePathname({
			type: type,
			room: room,
			channel: channel,
		})

		history.pushState(undefined, undefined, pathname)
	}

	const updateFromHistory = React.useCallback(() => {
		const parts = window.location.pathname.split("/")
		const [_, prefix, _type, _room, _channel] = parts

		if (prefix !== URL_PREFIX) {
			return null
		}

		if (_type !== type) {
			setType(_type || null)
		}

		if (_room !== room) {
			setRoom(_room || null)
		}

		if (_channel !== channel) {
			setChannel(_channel || null)
		}
	}, [type, room, channel, firstLoad])

	// listen to history changes
	React.useEffect(() => {
		updateFromHistory()
		setFirstLoad(false)

		window.addEventListener("popstate", updateFromHistory)

		return () => {
			window.removeEventListener("popstate", updateFromHistory)
		}
	}, [])

	React.useEffect(() => {
		if (!firstLoad) {
			updateToHistory()
		}
	}, [type, room, channel, firstLoad])

	return {
		type: type,
		room: room,
		channel: channel,
		setType: setType,
		setRoom: setRoom,
		setChannel: setChannel,
	}
}

// TODO: support url query key to auto select a room
// TODO: support room list pagination
// TODO: support hybrid group layout renderer
// TODO: improve group item design
// TODO: add support for mobile layout
// TODO: implement search logic
const SpacesPage = (props) => {
	const controller = spacesPageController()
	const [compact, setCompact] = React.useState(false)

	if (!app.userData || !app.userData.flags.includes("spaces_preview")) {
		app.navigation.goMain()
		return null
	}

	React.useEffect(() => {
		if (controller.type !== null) {
			setCompact(true)
		} else {
			setCompact(false)
		}
	}, [controller])

	return (
		<SpacesPageContext.Provider value={controller}>
			<div
				className={classnames("spaces-page", {
					["compact"]: compact,
				})}
			>
				<SpacesSidebar />

				<div className="spaces-page__content">
					{controller.type === "group" && (
						<Group group_id={controller.room} />
					)}

					{controller.type === "dm" && !controller.room && (
						<DMRoomsList
							selectedRoom={controller.room}
							onClickItem={(room) => {
								controller.setType("dm")
								controller.setRoom(room.to_user_id)
								controller.setChannel(null)
							}}
						/>
					)}

					{controller.type === "dm" && controller.room && (
						<DMRoom to_user_id={controller.room} />
					)}
				</div>
			</div>
		</SpacesPageContext.Provider>
	)
}

SpacesPage.options = {
	layout: {
		sidebar: false,
		centeredContent: false,
		maxHeight: true,
	},
}

export default SpacesPage
