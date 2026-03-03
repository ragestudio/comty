import React from "react"
import { Skeleton } from "antd"
import Button from "@ui/Button"
import classNames from "classnames"

import Image from "@components/Image"
import Icons from "@components/Icons"

import imageAverageColor from "@utils/imageAverageColor"

import GroupContext from "@contexts/WithSpaces/group"
import ContentPanelContext from "@contexts/WithSpaces/contentPanel"

import "./index.less"

const GroupHeader = () => {
	const contentPanel = React.useContext(ContentPanelContext)
	const group = React.useContext(GroupContext)

	const data = group?.data ?? {}

	const [groupCoverImageAverageColor, setGroupCoverImageAverageColor] =
		React.useState(null)

	const onClickSettingsButton = () => {
		contentPanel.setContent({
			type: "settings",
		})
	}

	const onClickInviteButton = () => {
		contentPanel.setContent({
			type: "settings",
		})
	}

	// calculate the average color of the group cover image
	React.useEffect(() => {
		if (data.cover) {
			imageAverageColor(data.cover).then((averageColor) => {
				setGroupCoverImageAverageColor(averageColor)
			})
		}
	}, [data])

	if (!group || group.loading) {
		return (
			<div className={"group-page__header"}>
				<div className="group-page__header__content">
					<Skeleton avatar />
				</div>
			</div>
		)
	}

	return (
		<div
			className={classNames("group-page__header", {
				["cover_light"]: groupCoverImageAverageColor?.isLight ?? false,
			})}
			style={{
				backgroundColor: data.coverColor,
			}}
		>
			{data.cover && (
				<div className="group-page__header__cover">
					<Image src={data.cover} />
				</div>
			)}

			<div className="group-page__header__content">
				<div className="group-page__header__content__icon">
					<Image src={data.icon} />
				</div>

				<div className="group-page__header__content__text">
					<h1>{data.name}</h1>
					<p>{data.description}</p>
				</div>
			</div>

			<div className="group-page__header__actions">
				{data.owner_user_id === app.userData._id && (
					<Button
						icon={<Icons.Settings />}
						onClick={onClickSettingsButton}
					/>
				)}

				<Button
					icon={<Icons.Link2 />}
					onClick={onClickInviteButton}
				/>
			</div>
		</div>
	)
}

export default GroupHeader
