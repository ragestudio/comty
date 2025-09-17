import React from "react"
import { Button } from "antd"
import classNames from "classnames"

import imageAverageColor from "@utils/imageAverageColor"
import { GroupContext as GroupPageContext } from "../../context"

import Image from "@components/Image"
import Icons from "@components/Icons"

import "./index.less"

const GroupHeader = ({ group }) => {
	const ctx = React.useContext(GroupPageContext)

	const [groupCoverImageAverageColor, setGroupCoverImageAverageColor] =
		React.useState(null)

	React.useEffect(() => {
		if (group.cover) {
			imageAverageColor(group.cover).then((averageColor) => {
				setGroupCoverImageAverageColor(averageColor)
			})
		}
	}, [group])

	return (
		<div
			className={classNames("group-page__header", {
				["cover_light"]: groupCoverImageAverageColor?.isLight ?? false,
			})}
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
						icon={<Icons.Settings />}
						onClick={() => {
							ctx.setSelectedContentTab({
								type: "settings",
							})
						}}
					/>
				)}

				<Button icon={<Icons.Link2 />} />
			</div>
		</div>
	)
}

export default GroupHeader
