import classNames from "classnames"
import React from "react"

export const Icon = ({
	children,
	className,
	spin,
}: {
	children: React.ReactElement
	className?: string
	spin?: boolean
}) => {
	const baseProps = {
		style: {
			fill: "currentColor",
		},
	}

	return (
		<span
			className={classNames("icon", className, {
				["spin"]: !!spin,
			})}
		>
			{React.cloneElement(children, baseProps)}
		</span>
	)
}
