import React from "react"
import * as antd from "antd"

import Image from "components/Image"

import API from "comty.js/models/sync/services/vrc"

import "./index.less"

const OTPRequired = (props) => {
    const { type, onFinish } = props

    return <div>
        <h1>[{type}] 2FA Required</h1>
        <p>Please input the code from your authenticator to continue</p>

        <antd.Form
            onFinish={(values) => {
                onFinish(values.code)
            }}
        >
            <antd.Form.Item
                label="Code"
                name="code"
            >
                <antd.Input />
            </antd.Form.Item>
            <antd.Form.Item>
                <antd.Button
                    type="primary"
                    htmlType="submit"
                >
                    Submit
                </antd.Button>
            </antd.Form.Item>
        </antd.Form>
    </div>
}

const VRC = () => {
    const [loading, setLoading] = React.useState(true)
    const [userData, setUserData] = React.useState(null)

    const displayOtpRequired = (type) => {
        return new Promise((resolve) => {
            app.layout.modal.open("vrc:two_factor_auth", OTPRequired, {
                props: {
                    type,
                    onFinish: (code) => {
                        resolve(code)
                        app.layout.modal.close("vrc:two_factor_auth")
                    },
                }
            })
        })
    }

    async function auth(username, password) {
        const result = API.auth(username, password, displayOtpRequired)

        console.log(result)

        if (result.success) {
            setUserData(result)
        }
    }

    React.useEffect(() => {
        if (!userData) {
            setLoading(true)

            API.get_session().then((data) => {
                setUserData(data)
                setLoading(false)
            })
        }

    }, [])

    console.log(userData)

    if (loading) {
        return <antd.Skeleton />
    }

    if (!userData) {
        return <div>
            <antd.Form
                onFinish={(values) => {
                    auth(values.username, values.password)
                }}
                layout="vertical"
                name="vrc-login-form"
            >
                <antd.Form.Item
                    label="Username"
                    name="username"
                >
                    <antd.Input />
                </antd.Form.Item>
                <antd.Form.Item
                    label="Password"
                    name="password"
                >
                    <antd.Input.Password />
                </antd.Form.Item>
                <antd.Form.Item>
                    <antd.Button
                        type="primary"
                        htmlType="submit"
                    >
                        Login
                    </antd.Button>
                </antd.Form.Item>
            </antd.Form>
        </div>
    }

    return <div className="vrc_profile">
        <antd.Avatar
            size={128}
            shape="square"
            src={userData.currentAvatarImageUrl}
        />

        <div className="vrc_profile_header">
            <h4>
                {
                    userData.username
                }
            </h4>

            <span>
                #{
                    userData.id
                }
            </span>
        </div>
    </div>
}

export default VRC