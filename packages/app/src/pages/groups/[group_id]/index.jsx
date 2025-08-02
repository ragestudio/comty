import React from "react"
import { Result } from "antd"
import classnames from "classnames"

import useTitle from "@hooks/useTitle"
import imageAverageColor from "@utils/imageAverageColor"

import GroupsModel from "@models/groups"
import GroupContext from "./context"

import Skeleton from "@components/Skeleton"
import Image from "@components/Image"
import MembersPanel from "./components/MembersPanel"
import ChannelsPanel from "./components/ChannelsPanel"
import ContentPanel from "./components/ContentPanel"

import "./index.less"

const GroupPage = (props) => {
	const [documentTitle, setDocumentTitle] = useTitle()
	const mediartcSocket = React.useRef(app.cores.mediartc.socket())

	const [group, setGroup] = React.useState(null)
	const [groupCoverImageAverageColor, setGroupCoverImageAverageColor] =
		React.useState(null)

	const [loadError, setLoadError] = React.useState(null)
	const [initialLoading, setInitialLoading] = React.useState(true)

	const loadGroup = React.useCallback(async () => {
		setLoadError(null)

		let data = await GroupsModel.get(props.params.group_id).catch(
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

		if (!data) {
			return null
		}

		let currentGroupState = await GroupsModel.rtc.getGroupState(data._id)

		console.debug("loaded data", {
			currentGroupState: currentGroupState,
			data: data,
		})

		if (currentGroupState.channels) {
			for (let channel of data.channels) {
				const currentStateChannel = currentGroupState.channels.find(
					(_c) => _c._id === channel._id,
				)

				if (currentStateChannel && currentStateChannel.clients) {
					channel.clients = currentStateChannel.clients
				}
			}
		}

		if (data.cover) {
			const averageColor = await imageAverageColor(data.cover)
			setGroupCoverImageAverageColor(averageColor)
		}

		setDocumentTitle(data.name)
		subscribeToGroupState()
		setInitialLoading(false)
		setGroup(data)
	}, [group])

	const handleGroupStateUpdate = React.useCallback(
		(update) => {
			console.log("group state update", update)

			switch (update.event) {
				case "client:joined":
				case "client:left": {
					setGroup((prev) => {
						const channels = prev.channels.map((channel) => {
							if (channel._id === update.channelId) {
								channel.clients = update.channelClients
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
			mediartcSocket.current.topics.subscribe(props.params.group_id)
		}
	}, [])

	const unsubscribeFromGroupState = React.useCallback(() => {
		if (mediartcSocket.current) {
			mediartcSocket.current.off(
				`group:${props.params.group_id}:state:update`,
				handleGroupStateUpdate,
			)
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
		<GroupContext.Provider
			value={{
				...group,
				groupCoverImageAverageColor: groupCoverImageAverageColor,
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
				</div>

				<div className="group-page__panels">
					<ChannelsPanel channels={group.channels ?? []} />
					<ContentPanel />
					<MembersPanel members={group.members ?? []} />
				</div>
			</div>
		</GroupContext.Provider>
	)
}

GroupPage.options = {
	layout: {
		centeredContent: false,
	},
}

export default GroupPage
