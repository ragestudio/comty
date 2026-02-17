import { Select, Upload } from "antd"
import Button from "@ui/Button"
import { Icons } from "@components/Icons"

import "./actions.less"

const VisibilityOptionLabel = ({ label, icon }) => (
	<div
		style={{
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "10px",
		}}
	>
		{icon}
		<p>{label}</p>
	</div>
)

const visibilityOptions = [
	{
		value: "public",
		label: (
			<VisibilityOptionLabel
				icon={<Icons.Earth />}
				label="Public"
			/>
		),
	},
	{
		value: "private",
		label: (
			<VisibilityOptionLabel
				icon={<Icons.EyeOff />}
				label="Private"
			/>
		),
	},
]

const PostCreatorActions = ({
	postObj,
	updatePostObj,
	loading,
	onPublish,
	canPublish,
	handleUploadMedia,
	handleAddPoll,
}) => {
	const mainButtonIcon = React.useCallback(() => {
		if (loading) {
			return <Icons.LoadingOutlined />
		}

		if (postObj?.reply_to) {
			return <Icons.ReplyOutlined />
		}

		return <Icons.Send />
	}, [loading, postObj?.reply_to])

	return (
		<div className="post-creator__actions">
			<Upload
				customRequest={(upload) => handleUploadMedia(upload.file)}
				multiple
				progress={false}
				fileList={[]}
			>
				<Button icon={<Icons.Upload />} />
			</Upload>

			<Button
				icon={<Icons.Vote />}
				onClick={handleAddPoll}
			/>

			<Select
				id="post-visibility"
				size="small"
				options={visibilityOptions}
				value={postObj?.visibility ?? "public"}
				onChange={(value) => updatePostObj("visibility", value)}
			/>

			<div className="post-creator__actions__right">
				<Button
					type={canPublish ? "primary" : "default"}
					onClick={onPublish}
					icon={mainButtonIcon()}
					disabled={!canPublish}
				>
					<p>Send</p>
				</Button>
			</div>
		</div>
	)
}

export default PostCreatorActions
