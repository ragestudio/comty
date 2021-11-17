import React from "react"
import ReactJson from "react-json-view"

import "./index.less"

export default class EviteDebugger extends React.Component { 
	static bindMain = "all"

	getClassname(classname) {
		return `evite-debugger_${classname}`
	}

	getExtensions() {
		const extensions = {}

		Array.from(this.props.contexts.main.extensionsKeys).forEach((extension) => {
			extensions[extension.key] = extension
		})

		return extensions
	}

	render() {
		const { app, main } = this.props.contexts

		return (
			<div>
				<div className={this.getClassname("content")}>
					<div>
						<h4>📦 Namespace</h4>
						<div>
							<ReactJson name="window.__evite" collapsed="true" src={window.__evite} />
						</div>
					</div>
					<div>
						<h4>📦 AppContext</h4>
						<div>
							<ReactJson name="app" collapsed="true" src={this.props.contexts.app} />
						</div>
					</div>
					<div>
						<h4>📦 MainContext</h4>
						<div>
							<ReactJson name="app" collapsed="true" src={this.props.contexts.main} />
						</div>
					</div>
					<div>
						<h4>🧰 Extensions</h4>
						<div>
							<ReactJson name="extensions" collapsed="true" src={getExtensions()} />
						</div>
					</div>
				</div>
			</div>
		)
	}
}