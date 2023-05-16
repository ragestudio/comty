import React from "react"
import * as antd from "antd"

import UserModel from "models/user"
import { Icons } from "components/Icons"

import "./index.less"

const ChangePasswordComponent = (props) => {
    const [loading, setLoading] = React.useState(false)

    const [currentPassword, setCurrentPassword] = React.useState("")
    const [newPassword, setNewPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")

    const [validCurrentPassword, setValidCurrentPassword] = React.useState(false)
    const [validNewPassword, setValidNewPassword] = React.useState(false)
    const [validConfirmPassword, setValidConfirmPassword] = React.useState(false)

    const [error, setError] = React.useState(null)

    const passwordMatch = newPassword === confirmPassword

    const canSubmit = () => {
        return validCurrentPassword && validNewPassword && validConfirmPassword && passwordMatch && !loading
    }

    const submit = async () => {
        if (!canSubmit()) return

        setError(null)
        setLoading(true)

        const result = await UserModel.changePassword({ currentPassword, newPassword }).catch((err) => {
            console.error(err)
            setError(err.response.data.message)
            return null
        })

        setLoading(false)

        if (result) {
            app.message.success("Password changed successfully")
            props.close()
        }
    }

    const handleChangeCurrentPassword = (e) => {
        const value = e.target.value

        setCurrentPassword(value)
        setValidCurrentPassword(value.length > 0)
    }

    const handleChangeNewPassword = (e) => {
        const value = e.target.value

        setNewPassword(value)
        setValidNewPassword(value.length > 0)
    }

    const handleChangeConfirmPassword = (e) => {
        const value = e.target.value

        setConfirmPassword(value)
        setValidConfirmPassword(value.length > 0)
    }

    return <div className="changePasswordPrompt">
        <div className="title">
            <h1><Icons.Lock />Change Password</h1>
        </div>

        <div className="form">
            <div className="item">
                <antd.Input.Password
                    name="oldPassword"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={handleChangeCurrentPassword}
                />
            </div>

            <antd.Divider />

            <div className="item">
                <antd.Input.Password
                    name="newPassword"
                    placeholder="New Password"
                    disabled={!validCurrentPassword}
                    value={newPassword}
                    onChange={handleChangeNewPassword}
                />
            </div>

            <div className="item">
                <antd.Input.Password
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    disabled={!validCurrentPassword}
                    value={confirmPassword}
                    onChange={handleChangeConfirmPassword}
                    status={passwordMatch ? "success" : "error"}
                />
            </div>

            <div className="item">
                <antd.Button
                    type="primary"
                    loading={loading}
                    disabled={!canSubmit()}
                    onClick={submit}
                >
                    Change Password
                </antd.Button>
            </div>

            <div className="item">
                {error}
            </div>
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