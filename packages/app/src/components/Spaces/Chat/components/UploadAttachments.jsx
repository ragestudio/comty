import classNames from "classnames"

import AttachmentMedia from "./UploadAttachment"

import "./UploadAttachments.less"

const Attachments = ({ items }) => {
	return (
		<div className="channel-chat__input__attachments">
			{items.map((item) => (
				<div
					key={item.uid}
					className={classNames(
						"channel-chat__input__attachments__item",
						{
							["pending"]: item.pending,
						},
					)}
				>
					<AttachmentMedia file={item.file} />
				</div>
			))}
		</div>
	)
}

export default Attachments
