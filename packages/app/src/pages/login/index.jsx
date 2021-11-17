import React from 'react'
import config from "config"
import * as antd from "antd"
import { FormGenerator } from 'components'
import { Icons } from 'components/Icons'

import "./index.less"

const formInstance = [
    {
        id: "username",
        element: {
            component: "Input",
            icon: "User",
            placeholder: "Username",
            props: null
        },
        item: {
            hasFeedback: true,
            rules: [
                {
                    required: true,
                    message: 'Please input your Username!',
                },
            ],
            props: null
        }
    },
    {
        id: "password",
        element: {
            component: "Input",
            icon: "Lock",
            placeholder: "Password",
            props: {
                type: "password"
            }
        },
        item: {
            hasFeedback: true,
            rules: [
                {
                    required: true,
                    message: 'Please input your Password!',
                },
            ],
        }
    },
    {
        id: "login_btn",
        withValidation: true,
        element: {
            component: "Button",
            props: {
                icon: "User",
                children: "Login",
                type: "primary",
                htmlType: "submit"
            }
        }
    },
    {
        id: "allowRegenerate",
        withValidation: false,
        element: {
            component: "Checkbox",
            props: {
                children: "Not expire",
                defaultChecked: false,
            }
        }
    }
]

export default class Login extends React.Component {
    static bindApp = ["sessionController"]

    handleFinish = async (values, ctx) => {
        ctx.toogleValidation(true)

        const payload = {
            username: values.username,
            password: values.password,
            allowRegenerate: values.allowRegenerate,
        }

        this.props.contexts.app.sessionController.login(payload, (error, response) => {
            ctx.toogleValidation(false)
            ctx.clearErrors()

            if (error) {
                ctx.shake("all")
                return ctx.error("result", error)
            } else {
                if (response.status === 200) {
                    this.onDone()
                }
            }
        })
    }

    onDone = () => {
        if (typeof this.props.onDone === "function") {
            this.props.onDone()
        }
    }

    componentWillUnmount() {
        window.app.SidebarController.toogleVisible(true)
        window.app.HeaderController.toogleVisible(true)
    }

    componentDidMount() {
        if (window.app.SidebarController.isVisible()) {
            window.app.SidebarController.toogleVisible(false)
        }

        if (window.app.HeaderController.isVisible()) {
            window.app.HeaderController.toogleVisible(false)
        }
    }

    render() {
        return (
            <div className="app_login">
                {this.props.session?.valid && <div className="session_available">
                    <h3><Icons.AlertCircle /> You already have a valid session.</h3>
                    <div className="session_card">
                        @{this.props.session.username}
                    </div>
                    <antd.Button type="primary" onClick={() => window.app.setLocation(config.app?.mainPath ?? "/main")} >Go to main</antd.Button>
                </div>}
                <div>
                    <FormGenerator
                        name="normal_login"
                        renderLoadingIcon
                        className="login-form"
                        items={formInstance}
                        onFinish={this.handleFinish}
                    />
                </div>
            </div>
        )
    }
}