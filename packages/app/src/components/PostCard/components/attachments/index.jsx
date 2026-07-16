import React from "react"
import { Button } from "antd"
import classNames from "classnames"
import PropTypes from "prop-types"

import AttachmentsGrid from "@components/AttachmentsGrid"

import "./index.less"

const Attachments = (props) => {
	const [nsfwAccepted, setNsfwAccepted] = React.useState(false)

	if (!props.attachments?.length) {
		return null
	}

	return (
		<div className={classNames("post_attachments", props.className)}>
			{props.flags && props.flags.includes("nsfw") && !nsfwAccepted && (
				<div className="nsfw_alert">
					<h2>This post may contain sensitive content.</h2>

					<Button onClick={() => setNsfwAccepted(true)}>
						Show anyways
					</Button>
				</div>
			)}

			<AttachmentsGrid attachments={props.attachments} />
		</div>
	)
}

Attachments.displayName = "Attachments"

Attachments.propTypes = {
	attachments: PropTypes.arrayOf(PropTypes.object),
}

Attachments.defaultProps = {
	attachments: [],
}

export default React.memo(Attachments)
