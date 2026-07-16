import React from "react"

class AppCrash extends React.Component {
	state = {
		error: null,
	}

	static getDerivedStateFromError(error) {
		return { error: error }
	}

	render() {
		if (this.state.error) {
			if (this.props.noDisplay) {
				return null
			}

			return (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						backgroundColor: "var(--background-color-accent)",
						gap: "20px",
						padding: "10px",
						borderRadius: "14px",
					}}
				>
					<h3>App Crashed!</h3>
					<code>{this.state.error.stack}</code>
				</div>
			)
		}

		return this.props.children
	}
}

export default AppCrash
