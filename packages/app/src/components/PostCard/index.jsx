import React from "react"
import * as antd from "antd"

import "./index.less"

export default class PostCard extends React.Component {
    render() {
        return <div className="postCard">
            <div className="userInfo">
                <div>
                    <antd.Avatar src={this.props.data.user.avatar} />
                </div>
                <div className="userName">
                    <h1>
                        @{this.props.data.user.username}
                    </h1>
                </div>
            </div>
            <div className="content">
                {this.props.data.message}
            </div>
        </div>
    }
}