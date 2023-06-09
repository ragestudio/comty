import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import classnames from "classnames"

import AuthModel from "models/auth"
import config from "config"

import "./index.less"

const stepsOnError = {
    username: "This username or email is not exist",
    password: "Password is incorrect",
}

const stepsValidations = {
    username: async (state) => {
        const check = await AuthModel.usernameValidation(state.username).catch((err) => {
            return {
                exists: false
            }
        })

        return check.exists
    },
}

const phasesToSteps = {
    0: "username",
    1: "password",
}

export default class Login extends React.Component {
    static pageStatement = {
        bottomBarAllowed: false
    }

    state = {
        loading: false,
        loginInputs: {},
        error: null,
        phase: 0,
    }

    formRef = React.createRef()

    handleFinish = async () => {
        const payload = {
            username: this.state.loginInputs.username,
            password: this.state.loginInputs.password,
        }

        this.clearError()
        this.toogleLoading(true)

        const loginProcess = await AuthModel.login(payload).catch((error) => {
            console.error(error, error.response)

            this.toogleLoading(false)
            this.onError(error.response.data.message)

            return false
        })

        if (loginProcess) {
            this.onDone()
        }
    }

    onDone = () => {
        if (typeof this.props.onDone === "function") {
            this.props.onDone()
        }

        if (typeof this.props.close === "function") {
            this.props.close()
        }
    }

    onClickRegister = () => {
        if (typeof this.props.close === "function") {
            this.props.close()
        }

        app.eventBus.emit("app.createRegister")
    }

    toogleLoading = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.loading
        }

        this.setState({
            loading: to
        })
    }

    clearError = () => {
        this.setState({
            error: null
        })
    }

    onError = (error) => {
        this.setState({
            error: error
        })
    }

    onUpdateInput = (input, value) => {
        // remove error from ref
        this.formRef.current.setFields([
            {
                name: input,
                errors: []
            }
        ])

        this.setState({
            loginInputs: {
                ...this.state.loginInputs,
                [input]: value
            }
        })
    }

    nextStep = async () => {
        const phase = phasesToSteps[this.state.phase]

        if (typeof stepsValidations[phase] === "function") {
            this.toogleLoading(true)

            const result = await stepsValidations[phase](this.state.loginInputs)

            this.toogleLoading(false)

            if (!result) {
                this.formRef.current.setFields([
                    {
                        name: phase,
                        errors: [stepsOnError[phase]]
                    },
                ])

                return false
            }
        }

        const to = this.state.phase + 1

        if (!phasesToSteps[to]) {
            return this.handleFinish()
        }

        this.setState({
            phase: to
        })
    }

    prevStep = () => {
        const to = this.state.phase - 1

        if (!phasesToSteps[to]) {
            console.warn("No step found for phase", to)

            return
        }

        this.setState({
            phase: to
        })
    }

    canNext = () => {
        if (this.state.loading) {
            return false
        }

        const { phase } = this.state

        const step = phasesToSteps[phase]

        return !!this.state.loginInputs[step]
    }

    render() {
        return <div className="login_wrapper">
            <div className="content">
                <h1>
                    Sign in
                </h1>
                <h3>
                    To continue to {config.app.siteName}
                </h3>

                <antd.Form
                    name="login"
                    className="fields"
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="on"
                    onFinish={this.handleFinish}
                    ref={this.formRef}
                >
                    <antd.Form.Item
                        name="username"
                        className="field"
                    >
                        <span><Icons.Mail /> Username or Email</span>
                        <antd.Input
                            placeholder="myusername / myemail@example.com"
                            onChange={(e) => this.onUpdateInput("username", e.target.value)}
                            onPressEnter={this.nextStep}
                            disabled={this.state.phase !== 0}
                            autoFocus
                        />
                    </antd.Form.Item>

                    <antd.Form.Item
                        name="password"
                        className={classnames(
                            "field",
                            {
                                ["hidden"]: this.state.phase !== 1,
                            }
                        )}
                    >
                        <span><Icons.Lock /> Password</span>
                        <antd.Input.Password
                            //placeholder="********"
                            onChange={(e) => this.onUpdateInput("password", e.target.value)}
                            onPressEnter={this.nextStep}
                        />
                    </antd.Form.Item>
                </antd.Form>

                <div className="component-row">
                    {
                        this.state.phase > 0 && <antd.Button
                            onClick={this.prevStep}
                            disabled={this.state.loading}
                        >
                            Back
                        </antd.Button>
                    }
                    <antd.Button
                        onClick={this.nextStep}
                        disabled={!this.canNext() || this.state.loading}
                        loading={this.state.loading}
                    >
                        Continue
                    </antd.Button>
                </div>

                <div className="field-error">
                    {this.state.error}
                </div>

                <div className="field" onClick={this.onClickRegister}>
                    <a>You need a account?</a>
                </div>
            </div>
        </div>
    }
}