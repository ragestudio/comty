import React from "react"
import * as antd from "antd"
import { createIconRender } from "components/Icons"

import "./index.less"

export default class BottomBar extends React.Component {
    state = {
        render: null
    }

    componentDidMount = () => {
        window.app.BottomBarController = {
            render: (fragment) => {
                this.setState({ render: fragment })
            },
            clear: () => {
                this.setState({ render: null })
            },
        }
    }

    onClickItemId = (id) => {
        window.app.setLocation(`/${id}`)
    }

    render() {
        if (this.state.render) {
            return <div className="bottomBar">
                {this.state.render}
            </div>
        }

        return <div className="bottomBar">
            <div className="items">
                <div onClick={() => window.app.openFabric()} key="fabric" id="fabric" className="item">
                    <div className="icon">
                        {createIconRender("PlusCircle")}
                    </div>
                </div>
                <div onClick={() => window.app.goMain()} key="main" id="main" className="item">
                    <div className="icon">
                        {createIconRender("Home")}
                    </div>
                </div>
                <div onClick={() => this.onClickItemId("nav")} key="nav" id="nav" className="item">
                    <div className="icon">
                        {createIconRender("Navigation")}
                    </div>
                </div>
                <div onClick={() => window.app.openSettings()} key="settings" id="settings" className="item">
                    <div className="icon">
                        {createIconRender("Settings")}
                    </div>
                </div>
                {this.props.user ? <div onClick={() => window.app.goToAccount()} key="account" id="account" className="item">
                    <div className="icon">
                        <antd.Avatar src={this.props.user?.avatar} />
                    </div>
                </div> : <div onClick={() => this.onClickItemId("login")} className="item">
                    <div key="login" id="login" className="icon">
                        {createIconRender("LogIn")}
                    </div>
                </div>}
            </div>
        </div>
    }
}