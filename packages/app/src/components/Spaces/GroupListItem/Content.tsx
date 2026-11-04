import classnames from "classnames"

export interface GroupListItemContentProps {
	title?: string | null
	description?: string | null
	className?: string
}

const GroupListItemContent = ({
	title,
	description,
	className,
}: GroupListItemContentProps) => {
	return (
		<div className={classnames("group-list__item__content", className)}>
			{title && <h3>{title}</h3>}
			{description && <p>{description}</p>}
		</div>
	)
}

export default GroupListItemContent
