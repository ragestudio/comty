import { Button } from "antd"

import { Icons } from "@components/Icons"

import { b } from "../style"

export type EditorActionsProps = {
	playing: boolean
	saving: boolean
	onPreview: () => void
	onStop: () => void
	onCancel: () => void
	onSave: () => void
}

const EditorActions = ({
	playing,
	saving,
	onPreview,
	onStop,
	onCancel,
	onSave,
}: EditorActionsProps) => {
	return (
		<div className={b.elem("actions")}>
			<Button
				icon={playing ? <Icons.Square /> : <Icons.Play />}
				onClick={playing ? onStop : onPreview}
			>
				{playing ? "Stop" : "Preview"}
			</Button>

			<Button
				onClick={onCancel}
				disabled={saving}
			>
				Cancel
			</Button>

			<Button
				type="primary"
				icon={<Icons.Save />}
				loading={saving}
				onClick={onSave}
			>
				Save clip
			</Button>
		</div>
	)
}

export default EditorActions
