import { Progress } from "antd"
import { Icons } from "@components/Icons"
import Button from "@ui/Button"

import "./attachments.less"

const ItemMediaPreview = ({ attachment }) => {
	if (!attachment) {
		return null
	}
	if (!attachment.metadata) {
		return null
	}
	if (!attachment.metadata["Content-Type"]) {
		return null
	}

	const openAttachment = () => {
		app.controls.openFullImageViewer(attachment.url)
	}

	switch (attachment.metadata["Content-Type"].split("/")[0]) {
		case "image":
			return (
				<img
					onClick={openAttachment}
					src={attachment.url}
					alt="Attachment Preview"
				/>
			)
		case "video":
			return (
				<video
					onClick={openAttachment}
					src={attachment.url}
					muted
					loop
				/>
			)
		default:
			return null
	}
}

const Item = ({ file, attachment, uploading, onClickDelete }) => {
	return (
		<div className="post-creator__attachments__item">
			{uploading && (
				<div className="post-creator__attachments__item__progress">
					<Progress
						type="circle"
						percent={file?.uploadPercent ?? 5}
						format={() => null}
						strokeWidth={20}
						size={30}
					/>
				</div>
			)}

			{file && (
				<>
					<div className="post-creator__attachments__item__details">
						<p>
							<Icons.File /> {file.type}
						</p>
					</div>
				</>
			)}

			{attachment && (
				<>
					<div className="post-creator__attachments__item__preview">
						<ItemMediaPreview attachment={attachment} />
					</div>

					<div className="post-creator__attachments__item__details">
						<p>
							<Icons.File /> {attachment.metadata["Content-Type"]}
						</p>
						<span>
							<Icons.Hash /> {attachment.metadata["File-Hash"]}
						</span>
					</div>

					<div className="post-creator__attachments__item__actions">
						<Button
							icon={<Icons.Trash />}
							onClick={onClickDelete}
						/>
					</div>
				</>
			)}
		</div>
	)
}

const Attachments = ({ pending, attachments, onClickDeleteItem }) => {
	return (
		<div className="post-creator__attachments">
			{pending.map((file) => (
				<Item
					file={file}
					uploading
				/>
			))}

			{attachments.map((attachment) => {
				return (
					<Item
						attachment={attachment}
						onClickDelete={() => onClickDeleteItem(attachment)}
					/>
				)
			})}
		</div>
	)
}

export default Attachments
