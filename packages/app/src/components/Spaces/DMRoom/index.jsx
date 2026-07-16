import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import { useSpacesNavigation } from "@contexts/WithSpaces/navigation"

import Chat from "@components/Spaces/Chat"

import "./index.less"

const DMChat = ({ to_user_id }) => {
	const spaces = useSpacesNavigation()

	const onClickCall = React.useCallback(() => {
		app.cores.mediartc.handlers().callUser(to_user_id, {
			alternativeSfx: true,
		})
	}, [to_user_id])

	const onClickBack = React.useCallback(() => {
		spaces.navigate({ type: null, room: null })
	}, [spaces])

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
					{spaces.headerContent && spaces.headerContent()}

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
