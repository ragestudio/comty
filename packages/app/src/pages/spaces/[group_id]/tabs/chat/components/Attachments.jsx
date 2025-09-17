import classNames from "classnames"

import AttachmentMedia from "./Attachment"

const Attachments = ({ items }) => {
	return (
		<div className="channel-chat__attachments">
			{items.map((item) => (
				<div
					key={item.uid}
					className={classNames("channel-chat__attachments__item", {
						["pending"]: item.pending,
					})}
				>
					<AttachmentMedia file={item.file} />
				</div>
			))}
		</div>
	)
}

export default Attachments
