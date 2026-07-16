import React from "react"
import { Skeleton } from "antd"
import Button from "@ui/Button"
import classNames from "classnames"

import Image from "@components/Image"
import Icons from "@components/Icons"

import imageAverageColor from "@utils/imageAverageColor"

import GroupContext from "@contexts/WithSpaces/group"
import { useSpacesNavigation } from "@contexts/WithSpaces/navigation"

import "./index.less"

const GroupHeader = () => {
	const spaces = useSpacesNavigation()
	const group = React.useContext(GroupContext)

	const data = group?.data ?? {}

	const [groupCoverImageAverageColor, setGroupCoverImageAverageColor] =
		React.useState(null)

	const onClickSettingsButton = () => {
		spaces.navigate({ channel: null, subview: "settings" })
	}

	const onClickInviteButton = () => {
		spaces.navigate({ channel: null, subview: "settings" })
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
				["has_banner"]: data.cover,
				["cover_light"]:
					(data.cover && groupCoverImageAverageColor?.isLight) ??
					false,
				["average_color"]: groupCoverImageAverageColor?.hex,
			})}
			style={{
				"--cover-av-color": groupCoverImageAverageColor?.value.slice(
					0,
					-1,
				),
			}}
		>
			<div className="group-page__header__content">
				<div className="group-page__header__content__text">
					<h1>{data.name}</h1>
				</div>

				<div className="group-page__header__actions">
					<Button
						icon={<Icons.Settings />}
						onClick={onClickSettingsButton}
					/>
				</div>
			</div>

			{data.cover && (
				<div className="group-page__header__cover">
					<Image src={data.cover} />
				</div>
			)}
		</div>
	)
}

export default GroupHeader
