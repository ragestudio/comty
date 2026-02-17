import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"

import "./Button.less"

const Button = ({ children, icon, className, onClick, type, disabled }) => {
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
			className={classes}
			onClick={onClick}
			disabled={disabled}
		>
			{icon}
			{children}
		</button>
	)
}

Button.propTypes = {
	className: PropTypes.string,
	icon: PropTypes.element,
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
}

Button.defaultProps = {
	className: null,
	icon: null,
	onClick: () => {},
	type: "ghost",
	disabled: false,
}

export default Button
