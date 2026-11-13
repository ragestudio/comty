import { Button } from "antd"

import { Icons } from "@components/Icons"

import { b } from "../style"

export type EditorHeaderProps = {
	title: string
	disabled?: boolean
	onClose: () => void
}

const EditorHeader = ({
	title,
	disabled = false,
	onClose,
}: EditorHeaderProps) => {
	return (
		<div className={b.elem("header")}>
			<h2>{title}</h2>

			<Button
				type="text"
				icon={<Icons.X />}
				disabled={disabled}
				onClick={onClose}
			/>
		</div>
	)
}

export default EditorHeader
