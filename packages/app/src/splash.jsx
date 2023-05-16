import React from "react"
import classnames from "classnames"
import { Icons } from "components/Icons"

import config from "config"

export default class Splash extends React.Component {
    state = {
        visible: true
    }

    onUnmount = async () => {
        this.setState({
            visible: false
        })

        return await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        })
    }

    render() {
        return <div className={classnames("app_splash_wrapper", { ["fade-away"]: !this.state.visible })}>
            <div className="splash_logo">
                <img src={config.logo.alt} />
            </div>
            <div className="splash_label">
                <Icons.LoadingOutlined />
            </div>
            <div className="splash_footer">
                <object id="powered_by" data={config.logo.ragestudio_full} type="image/svg+xml" />
            </div>
        </div>
    }
}