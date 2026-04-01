import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"

import LoadIcon from "./LoadIcon"

import "./Button.less"

const Button = ({
	children,
	icon,
	className,
	onClick,
	type,
	disabled = false,
	loading = false,
}) => {
	const onlyIcon = !children && icon

	const classes = React.useMemo(() => {
		const classes = [className]

		if (!type) {
			classes.push("default")
		} else {
			classes.push(type)
		}

		return classnames(classes)
	}, [className, type])

	return (
		<button
			className={classnames(classes, { "only-icon": onlyIcon })}
			onClick={onClick}
			disabled={disabled}
		>
			{loading && (
				<div className="button-icon">
					<LoadIcon />
				</div>
			)}

			{!loading && icon && <div className="button-icon">{icon}</div>}

			{children}
		</button>
	)
}

Button.propTypes = {
	className: PropTypes.string,
	icon: PropTypes.element,
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
}

Button.defaultProps = {
	className: null,
	icon: null,
	onClick: () => {},
	type: "ghost",
	disabled: false,
	loading: false,
}

export default Button
