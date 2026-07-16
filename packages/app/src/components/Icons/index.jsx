import React from "react"
import { Icon } from "./icon"

import * as lucide from "lucide-react"
import Bot from "./customIcons/bot"
import VrChatIcon from "./customIcons/vrchat"
import VerifiedBadge from "./customIcons/verifiedBadge"
import Crown from "./customIcons/crown"
import Lossless from "./customIcons/lossless"
import Ogg from "./customIcons/ogg"
import Connection from "./customIcons/connection"
import LoadingOutlined from "./customIcons/loading"
import ReactIcon from "./customIcons/react"
import AntdIcon from "./customIcons/antd"

import "./index.less"

export const Icons = {
	...lucide,
	LoadingOutlined: (props) => (
		<Icon
			{...props}
			children={LoadingOutlined}
			spin
		/>
	),
	Bot: (props) => <Bot {...props} />,
	Lossless: (props) => <Lossless {...props} />,
	verifiedBadge: (props) => <VerifiedBadge {...props} />,
	VrChat: (props) => <VrChatIcon {...props} />,
	Crown: (props) => <Crown {...props} />,
	Ogg: (props) => <Ogg {...props} />,
	Connection: (props) => <Connection {...props} />,
	React: (props) => <ReactIcon {...props} />,
	Antd: (props) => <AntdIcon {...props} />,
}

export function createIconRender(icon, props) {
	if (React.isValidElement(icon)) {
		return icon
	}

	if (typeof Icons[icon] !== "undefined") {
		return React.createElement(Icons[icon], props)
	}

	return null
}

export default Icons
