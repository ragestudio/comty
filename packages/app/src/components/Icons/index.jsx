import React from "react"

import "./index.less"

import Bot from "./customIcons/bot"
import VrChatIcon from "./customIcons/vrchat"
import VerifiedBadge from "./customIcons/verifiedBadge"
import Crown from "./customIcons/crown"
import Lossless from "./customIcons/lossless"
import Ogg from "./customIcons/ogg"
import Connection from "./customIcons/connection"

// import icons lib
import * as lib1 from "react-icons/fi"
import * as lib2 from "@ant-design/icons"
import * as lib3 from "react-icons/md"
import * as lib4 from "react-icons/io"
import * as lib5 from "react-icons/si"
import * as lib6 from "react-icons/fa"
import * as lib7 from "react-icons/tb"
import * as lib10 from "lucide-react"

export const Icons = {
	...lib1,
	...lib2,
	...lib3,
	...lib4,
	...lib5,
	...lib6,
	...lib7,
	...lib10,
	Bot: (props) => <Bot {...props} />,
	Lossless: (props) => <Lossless {...props} />,
	verifiedBadge: (props) => <VerifiedBadge {...props} />,
	VrChat: (props) => <VrChatIcon {...props} />,
	Crown: (props) => <Crown {...props} />,
	Ogg: (props) => <Ogg {...props} />,
	Connection: (props) => <Connection {...props} />,
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
