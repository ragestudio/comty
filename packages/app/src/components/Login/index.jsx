import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

const LoginSteps = {
    "username": (props) => {
        const handleUpdate = (e) => {
            props.onUpdate(e.target.value)
        }

        return <div className="field">
            <span><Icons.Mail /> Username or Email</span>

            <div className="component">
                <antd.Input
                    name="username"
                    defaultValue={props.defaultValue}
                    placeholder="myusername / myemail@example.com"
                    onChange={handleUpdate}
                    onPressEnter={props.next}
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="on"
                    autoFocus
                />
            </div>
        </div>
    },
    "password": (props) => {
        const handleUpdate = (e) => {
            props.onUpdate(e.target.value)
        }

        return <div className="field">
            <span><Icons.Lock /> Password</span>

            <div className="component">
                <antd.Input.Password
                    name="password"
                    defaultValue={props.defaultValue}
                    onChange={handleUpdate}
                    onPressEnter={props.next}
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="on"
                    autoFocus
                />
            </div>
        </div>
    }
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

    handleFinish = async () => {
        const payload = {
            username: this.state.loginInputs.username,
            password: this.state.loginInputs.password,
        }

        this.clearError()
        this.toogleLoading(true)

        this.props.sessionController.login(payload, (error, response) => {
            this.toogleLoading(false)

            if (error) {
                return this.onError(error)
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
        this.setState({
            loginInputs: {
                ...this.state.loginInputs,
                [input]: value
            }
        })
    }

    renderCurrentInput = () => {
        const { phase } = this.state

        const step = phasesToSteps[phase]

        return React.createElement(LoginSteps[step], {
            onUpdate: (...props) => this.onUpdateInput(step, ...props),
            next: this.nextStep,
            defaultValue: this.state.loginInputs[step],
        })
    }

    nextStep = () => {
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

                <div className="fields">
                    {this.renderCurrentInput()}

                    <div className="field">
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
                    </div>

                    <div className="field-error">
                        {this.state.error}
                    </div>

                    <div className="field">
                        <a>You need a account?</a>
                    </div>
                </div>
            </div>
        </div>
    }
}