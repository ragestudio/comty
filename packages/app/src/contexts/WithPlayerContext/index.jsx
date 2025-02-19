import React from "react"

function deepUnproxy(obj) {
	if (Array.isArray(obj)) {
		obj = [...obj]
	} else {
		obj = Object.assign({}, obj)
	}

	for (let key in obj) {
		if (obj[key] && typeof obj[key] === "object") {
			obj[key] = deepUnproxy(obj[key])
		}
	}

	return obj
}

export const usePlayerStateContext = (updater) => {
	const [state, setState] = React.useState({ ...app.cores.player.state })

	function handleStateChange(newState) {
		newState = deepUnproxy(newState)

		// check if any changes happened
		if (newState === state) {
			return
		}

		setState(newState)

		if (typeof updater === "function") {
			updater(newState)
		}
	}

	React.useEffect(() => {
		handleStateChange(app.cores.player.state)

		app.cores.player.eventBus().on("player.state.update", handleStateChange)

		return () => {
			app.cores.player
				.eventBus()
				.off("player.state.update", handleStateChange)
		}
	}, [])

	return [state, setState]
}

export const Context = React.createContext({})

export class WithPlayerContext extends React.Component {
	state = app.cores.player.state

	events = {
		"player.state.update": (state) => {
			this.setState(state)
		},
	}

	componentDidMount() {
		for (const [event, handler] of Object.entries(this.events)) {
			app.cores.player.eventBus().on(event, handler)
		}
	}

	componentWillUnmount() {
		for (const [event, handler] of Object.entries(this.events)) {
			app.cores.player.eventBus().off(event, handler)
		}
	}

	render() {
		return (
			<Context.Provider value={this.state}>
				{this.props.children}
			</Context.Provider>
		)
	}
}

export default WithPlayerContext
