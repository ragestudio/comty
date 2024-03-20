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
        mfa_required: null
    }

    formRef = React.createRef()

    handleFinish = async () => {
        this.setState({
            mfa_required: false,
        })

        const payload = {
            username: this.state.loginInputs.username,
            password: this.state.loginInputs.password,
            mfa_code: this.state.loginInputs.mfa_code,
        }

        this.clearError()
        this.toggleLoading(true)

        await AuthModel.login(payload, this.onDone).catch((error) => {
            console.error(error, error.response)

            this.toggleLoading(false)
            this.onError(error.response.data.error)

            return false
        })
    }

    onDone = async ({ mfa_required } = {}) => {
        if (mfa_required) {
            this.setState({
                loading: false,
                mfa_required: mfa_required,
            })

            return false
        }

        if (typeof this.props.close === "function") {
            await this.props.close({
                unlock: true
            })
        }

        if (typeof this.props.onDone === "function") {
            this.props.onDone()
        }

        return true
    }

    onClickForgotPassword = () => {
        if (this.props.locked) {
            this.props.unlock()
        }

        if (typeof this.props.close === "function") {
            this.props.close()
        }

        app.location.push("/apr")
    }

    onClickRegister = () => {
        if (this.props.locked) {
            this.props.unlock()
        }

        if (typeof this.props.close === "function") {
            this.props.close()
        }

        app.controls.openRegisterForm({
            defaultLocked: this.props.locked
        })
    }

    toggleLoading = (to) => {
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
        if (input === "username") {
            value = value.toLowerCase()
            value = value.trim()
        }
        
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
            this.toggleLoading(true)

            const result = await stepsValidations[phase](this.state.loginInputs)

            this.toggleLoading(false)

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
            phase: to,
            mfa_required: null,
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

                    <antd.Form.Item
                        name="mfa_code"
                        className={classnames(
                            "field",
                            {
                                ["hidden"]: !this.state.mfa_required,
                            }
                        )}
                    >
                        <span><Icons.Lock /> Verification Code</span>

                        {
                            this.state.mfa_required && <>
                                <p>We send a verification code to [{this.state.mfa_required.sended_to}]</p>

                                <p>
                                    Didn't receive the code? <a onClick={this.handleFinish}>Resend</a>
                                </p>
                            </>
                        }

                        <antd.Input
                            placeholder="4 Digit MFA code"
                            onChange={(e) => this.onUpdateInput("mfa_code", e.target.value)}
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

                <div className="field" onClick={this.onClickForgotPassword}>
                    <a>Forgot your password?</a>
                </div>

                <div className="field" onClick={this.onClickRegister}>
                    <a>You need a account?</a>
                </div>
            </div>
        </div>
    }
}