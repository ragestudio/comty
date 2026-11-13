import Button from "@/ui/Button"
import Icons from "@/components/Icons"

import styles from "./actions.module.less"

interface EditorActionsProps {
	hasChanges: boolean
	onRevert: () => void
	onSave: () => void
}

export const EditorActions = ({
	hasChanges,
	onRevert,
	onSave,
}: EditorActionsProps) => {
	return (
		<div className={styles.actions}>
			{hasChanges && (
				<Button
					icon={<Icons.ArrowBigLeft />}
					onClick={onRevert}
				>
					Revert
				</Button>
			)}

			<Button
				icon={<Icons.Save />}
				disabled={!hasChanges}
				type={hasChanges ? "primary" : "default"}
				onClick={onSave}
			>
				Save
			</Button>
		</div>
	)
}
