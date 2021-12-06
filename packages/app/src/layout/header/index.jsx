import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
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

	onClickCreate = () => {
		window.app.openFabric()
	}

	render() {
		return (
			<antd.Layout.Header className={classnames(`app_header`, { ["hidden"]: !this.state.visible })}>
				<div>
					<AppSearcher />
				</div>
				<div>
					<antd.Button onClick={this.onClickCreate} type="primary" shape="circle" icon={<Icons.Plus style={{ margin: 0 }} />} style={{ display: "flex", alignItems: "center", justifyContent: "center" }} />
				</div>
			</antd.Layout.Header>
		)
	}
}
