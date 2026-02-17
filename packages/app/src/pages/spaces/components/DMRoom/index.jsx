import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import ContentPanelContext, {
	useContentPanelHeaderState,
} from "@pages/spaces/contexts/contentPanel"
import SpacesPageContext from "@pages/spaces/contexts/page"

import Chat from "@pages/spaces/components/Chat"

import "./index.less"

const DMChat = ({ to_user_id }) => {
	const page = React.useContext(SpacesPageContext)

	const onClickCall = React.useCallback(() => {
		app.cores.mediartc.handlers().callUser(to_user_id, {
			alternativeSfx: true,
		})
	}, [to_user_id])

	const onClickBack = React.useCallback(() => {
		page.setRoom(null)
		page.setChannel(null)
	}, [])

	const { headerContent, registerHeaderContent, unregisterHeaderContent } =
		useContentPanelHeaderState()

	return (
		<ContentPanelContext
			value={{
				headerContent: headerContent,
				registerHeaderContent: registerHeaderContent,
				unregisterHeaderContent: unregisterHeaderContent,
			}}
		>
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
						{headerContent && headerContent()}

						<Button
							icon={<Icons.Phone />}
							onClick={onClickCall}
						/>
					</div>
				</div>

				<Chat
					_id={to_user_id}
					type="direct"
				/>
			</div>
		</ContentPanelContext>
	)
}

DMChat.options = {
	layout: {
		//centeredContent: false,
		maxHeight: true,
	},
}

export default DMChat
