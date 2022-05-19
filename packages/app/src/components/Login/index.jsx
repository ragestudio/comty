import React from "react"
import * as antd from "antd"
import { FormGenerator } from "components"
import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

const formInstance = [
    {
        id: "username",
        element: {
            component: "Input",
            icon: "User",
            placeholder: "Username",
            props: {
                autoCorrect: "off",
                autoCapitalize: "none",
                className: "login-form-username",
            },
        },
        item: {
            hasFeedback: true,
            rules: [
                {
                    required: true,
                    message: 'Please input your Username!',
                },
            ],
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
]

export default class Login extends React.Component {
    static pageStatement = {
        bottomBarAllowed: false
    }

    handleFinish = async (values, ctx) => {
        ctx.toogleValidation(true)

        const payload = {
            username: values.username,
            password: values.password,
            allowRegenerate: values.allowRegenerate,
        }

        this.props.sessionController.login(payload, (error, response) => {
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

        if (typeof this.props.close === "function") {
            this.props.close()
        }
    }

    render() {
        return <div className="login">
            <div className="header">
                <div className="logo">
                    <img src={config.logo?.full} />
                </div>
            </div>
            {this.props.session && <div className="session_available">
                <h3><Icons.AlertCircle /> You already have a valid session.</h3>
                <div className="session_card">
                    @{this.props.session.username}
                </div>
                <antd.Button type="primary" onClick={() => window.app.setLocation(config.app?.mainPath ?? "/main")} >Go to main</antd.Button>
            </div>}
            <FormGenerator
                name="normal_login"
                renderLoadingIcon
                className="login-form"
                items={formInstance}
                onFinish={this.handleFinish}
            />
        </div>
    }
}