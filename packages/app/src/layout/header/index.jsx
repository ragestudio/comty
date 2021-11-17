import React from "react"
import * as antd from "antd"
import { AppSearcher } from "components"
import classnames from "classnames"

import "./index.less"

export default class Header extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			visible: true,
		}

		this.HeaderController = {
			toogleVisible: (to) => {
				this.setState({ visible: to ?? !this.state.visible })
			},
			isVisible: () => this.state.visible,
		}

		window.app["HeaderController"] = this.HeaderController
	}

	render() {
		return (
			<antd.Layout.Header className={classnames(`app_header`, { ["hidden"]: !this.state.visible })}>
				<div>
					<AppSearcher />
				</div>
			</antd.Layout.Header>
		)
	}
}
