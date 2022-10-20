import React from "react"
import * as antd from "antd"

const ChangePasswordComponent = (props) => {
    const [loading, setLoading] = React.useState(false)

    return <div className="changePasswordPrompt">
        <div className="title">
            <h1>Change Password</h1>
        </div>

        <div className="form">
            
        </div>
    </div>
}

export default (props) => {
    const onClick = () => {
        app.SidedrawerController.open("passwordChange", ChangePasswordComponent)
    }

    return <antd.Button onClick={onClick}>
        Change password
    </antd.Button>
}