import { useContentContext } from "./context"
import classNames from "clsx"

import styles from "./header.module.less"
import createBem from "@/utils/createBem"

const b = createBem("content_panel_header", styles)

export const ContentPanelHeader = () => {
	const { header } = useContentContext()

	if (!header.visible) {
		return null
	}

	const Icon = header.icon

	return (
		<div className={classNames(b(), "bg-accent")}>
			<p>
				{Icon && <Icon />}
				{header.title}
			</p>

			{header.description && (
				<>
					<div className="divider" />
					<span>{header.description}</span>
				</>
			)}

			{header.extraContent && (
				<div className={b.elem("content")}>{header.extraContent}</div>
			)}
		</div>
	)
}

export default ContentPanelHeader
