import React from "react"
import { Result, Button } from "antd"
import classnames from "classnames"

import useTitle from "@hooks/useTitle"
import imageAverageColor from "@utils/imageAverageColor"

import GroupsModel from "@models/groups"
import GroupPageContext from "./context"

import Skeleton from "@components/Skeleton"
import Image from "@components/Image"
import Icons from "@components/Icons"
import MembersPanel from "./components/MembersPanel"
import ChannelsPanel from "./components/ChannelsPanel"
import ContentPanel from "./components/ContentPanel"

import "./index.less"

const GroupPage = (props) => {
	const [documentTitle, setDocumentTitle] = useTitle()
	const mediartcSocket = React.useRef(app.cores.mediartc.socket())
	const [selectedContentTab, setSelectedContentTab] =
		React.useState("default")

	const [group, setGroup] = React.useState(null)
	const [groupCoverImageAverageColor, setGroupCoverImageAverageColor] =
		React.useState(null)

	const [loadError, setLoadError] = React.useState(null)
	const [initialLoading, setInitialLoading] = React.useState(true)

	const loadGroup = React.useCallback(async () => {
		setLoadError(null)

		let groupData = await GroupsModel.get(props.params.group_id).catch(
			(error) => {
				setLoadError(error)
				console.error(error)

				app.cores.notifications.new({
					type: "error",
					title: "Failed to load group",
					description: error.message,
				})
				return null
			},
		)

		if (!groupData) {
			return null
		}

		groupData.channels = await GroupsModel.channels.list(groupData._id)

		// load state
		let currentGroupState = await GroupsModel.rtc.getGroupState(
			groupData._id,
		)

		// add clients array to each channel
		groupData.channels = groupData.channels.map((channel) => {
			return {
				...channel,
				clients: [],
			}
		})

		// override with current channels state
		if (currentGroupState.channels) {
			for (let channel of groupData.channels) {
				const currentStateChannel = currentGroupState.channels.find(
					(_c) => _c._id === channel._id,
				)

				if (currentStateChannel && currentStateChannel.clients) {
					channel.clients = currentStateChannel.clients
				}
			}
		}

		// override with current connected members state
		if (currentGroupState.connected_members) {
			groupData.connected_members = currentGroupState.connected_members
		}

		if (groupData.cover) {
			const averageColor = await imageAverageColor(groupData.cover)
			setGroupCoverImageAverageColor(averageColor)
		}

		// load the first text channel
		const firstTextChannel = groupData.channels.find(
			(channel) => channel.kind === "chat",
		)

		setSelectedContentTab({
			type: "chat",
			props: { _id: firstTextChannel._id },
		})

		setDocumentTitle(groupData.name)
		subscribeToGroupState()
		setInitialLoading(false)
		setGroup(groupData)
	}, [group])

	const handleGroupStateUpdate = React.useCallback(
		(data) => {
			console.debug("group state update", data)

			const { event, payload } = data

			switch (event) {
				case "client:joined":
				case "client:left": {
					setGroup((prev) => {
						const channels = prev.channels.map((channel) => {
							if (channel._id === payload.channelId) {
								channel.clients = payload.channelClients
							}

							return channel
						})

						return {
							...prev,
							channels: channels,
						}
					})
					break
				}
				case "user:online": {
					setGroup((prev) => {
						const connected_members = [...prev.connected_members]

						if (!connected_members.includes(payload.userId)) {
							connected_members.push(payload.userId)
						}

						return {
							...prev,
							connected_members: connected_members,
						}
					})
					break
				}
				case "user:offline": {
					setGroup((prev) => {
						let connected_members = [...prev.connected_members]

						if (connected_members.includes(payload.userId)) {
							connected_members = connected_members.filter(
								(memberId) => memberId !== payload.userId,
							)
						}

						return {
							...prev,
							connected_members: connected_members,
						}
					})

					break
				}
				default: {
					break
				}
			}
		},
		[group],
	)

	const subscribeToGroupState = React.useCallback(() => {
		if (mediartcSocket.current) {
			mediartcSocket.current.on(
				`group:${props.params.group_id}:state:update`,
				handleGroupStateUpdate,
			)
			//mediartcSocket.current.topics.subscribe(props.params.group_id)
			mediartcSocket.current.topics.subscribe(
				"group:subscribe_state",
				props.params.group_id,
			)
		}
	}, [])

	const unsubscribeFromGroupState = React.useCallback(() => {
		if (mediartcSocket.current) {
			mediartcSocket.current.off(
				`group:${props.params.group_id}:state:update`,
				handleGroupStateUpdate,
			)
			//mediartcSocket.current.topics.unsubscribe(props.params.group_id)
			mediartcSocket.current.topics.unsubscribe(props.params.group_id)
		}
	}, [])

	React.useEffect(() => {
		loadGroup()

		return () => {
			unsubscribeFromGroupState()
		}
	}, [])

	if (loadError) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load group"
			/>
		)
	}

	if (initialLoading) {
		return <Skeleton />
	}

	return (
		<GroupPageContext.Provider
			value={{
				group: group,
				groupCoverImageAverageColor: groupCoverImageAverageColor,
				selectedContentTab: selectedContentTab,
				setSelectedContentTab: setSelectedContentTab,
			}}
		>
			<div
				style={{
					"--isCoverImageLight": groupCoverImageAverageColor
						? groupCoverImageAverageColor.isLight
						: false,
				}}
				className={classnames("group-page", {
					["group-page__cover_light"]:
						groupCoverImageAverageColor?.isLight ?? false,
				})}
			>
				<div
					className="group-page__header"
					style={{
						backgroundColor: group.coverColor,
					}}
				>
					{group.cover && (
						<div className="group-page__header__cover">
							<Image src={group.cover} />
						</div>
					)}

					<div className="group-page__header__content">
						<div className="group-page__header__content__icon">
							<Image src={group.icon} />
						</div>

						<div className="group-page__header__content__text">
							<h1>{group.name}</h1>
							<p>{group.description}</p>
						</div>
					</div>

					<div className="group-page__header__actions">
						{group.owner_user_id === app.userData._id && (
							<Button
								icon={<Icons.MdSettings />}
								onClick={() => {
									setSelectedContentTab({
										type: "settings",
									})
								}}
							/>
						)}

						<Button icon={<Icons.IoMdLink />} />
					</div>
				</div>

				<div className="group-page__panels">
					<ChannelsPanel />
					<ContentPanel selectedTab={selectedContentTab} />
					<MembersPanel />
				</div>
			</div>
		</GroupPageContext.Provider>
	)
}

GroupPage.options = {
	layout: {
		centeredContent: false,
		maxHeight: true,
	},
}

export default GroupPage
