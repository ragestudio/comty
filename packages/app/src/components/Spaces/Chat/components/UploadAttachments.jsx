import { Progress } from "antd"
import classNames from "classnames"

import { Icons } from "@components/Icons"

import AttachmentMedia from "./UploadAttachment"

import "./UploadAttachments.less"

const Attachments = ({ items, onRemove }) => {
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

					{item.pending && (
						<div className="channel-chat__input__attachments__item__progress">
							<Progress
								type="circle"
								percent={item.progress ?? 0}
								strokeWidth={20}
								format={() => null}
							/>
						</div>
					)}

					<button
						className="channel-chat__input__attachments__item__remove"
						onClick={() => onRemove(item.uid)}
						title={
							item.pending ? "Cancel upload" : "Remove attachment"
						}
					>
						<Icons.X />
					</button>
				</div>
			))}
		</div>
	)
}

export default Attachments
