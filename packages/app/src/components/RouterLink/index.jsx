import React from "react"

const RouterLink = ({ to, children, onClick }) => {
	const handleClick = () => {
		if (typeof onClick === "function") {
			onClick()
		}

		app.location.push(to)
	}

	return <a onClick={handleClick}>{children}</a>
}

export default RouterLink
