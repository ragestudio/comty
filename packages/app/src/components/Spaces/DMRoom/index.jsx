import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import { useSpacesNavigation } from "@/stores/spaces/navigation"

import Chat from "@components/Spaces/Chat"

import "./index.less"

const DMChat = ({ to_user_id }) => {
	const nav = useSpacesNavigation()

	const onClickCall = React.useCallback(() => {
		// app.cores.mediartc.handlers().callUser(to_user_id, {
		// 	alternativeSfx: true,
		// })
	}, [to_user_id])

	const onClickBack = React.useCallback(() => {
		nav.actions.navigate({ type: null, room: null })
	}, [nav])

	return (
		<div className="chat-page">
			<div className="chat-page__header">
				<div className="chat-page__header__left">
					<div
						className="chat-page__header__back-button"
						onClick={onClickBack}
					>
						<Icons.ChevronLeft />
					</div>

					<UserPreview
						user_id={to_user_id}
						presence
					/>
				</div>
				<div className="chat-page__header__right">
					{nav.headerContent && nav.headerContent()}

					<Button
						icon={<Icons.Phone />}
						onClick={onClickCall}
					/>
				</div>
			</div>

			<Chat
				_id={to_user_id}
				type="dm"
			/>
		</div>
	)
}

DMChat.options = {
	layout: {
		//centeredContent: false,
		maxHeight: true,
	},
}

export default DMChat
