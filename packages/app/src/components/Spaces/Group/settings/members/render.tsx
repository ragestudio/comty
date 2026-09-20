import type { Member } from "@comty/shared/types/spaces/member"

import React from "react"
import { Flex, Listy, Tag } from "antd"

import { Icons } from "@components/Icons"
import { useGroupMembers } from "@comty/spaces-lib"
import Image from "@components/Image"

import "./index.less"

const MemberRender = (item: Member) => {
	return (
		<div className="settings-members__list__item">
			<div className="settings-members__list__item__avatar">
				<Image src={item.user.avatar} />
			</div>

			<p>{item.user.username}</p>

			<Tag>
				{item.roles.map((tag) => (
					<span key={tag._id}>{tag.label}</span>
				))}
			</Tag>
		</div>
	)
}

const MembersSettings = () => {
	const members = useGroupMembers()
	const [loading, setLoading] = React.useState(false)
	const loadingRef = React.useRef(false)

	const onScroll: React.UIEventHandler<HTMLElement> = (event) => {
		const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

		if (scrollHeight - scrollTop - clientHeight > 200 || loadingRef.current) {
			return
		}

		loadingRef.current = true
		// setLoading(true)
	}

	return (
		<div className="settings-members">
			<div className="settings-member__list">
				<Listy<Member>
					virtual
					rowKey="_id"
					items={members.items}
					itemRender={MemberRender}
					onScroll={onScroll}
				/>
			</div>

			<Flex
				justify="center"
				align="center"
			>
				{loading ? (
					<Icons.LoadingOutlined />
				) : (
					<p>
						{members.items.length}/{members.total_items} items loaded
					</p>
				)}
			</Flex>
		</div>
	)
}

export default MembersSettings
