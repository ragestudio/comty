import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons, createIconRender } from "@components/Icons"

import AuthModel from "@models/auth"

import "./index.less"

import UsernameStep from "./steps/username"
import PasswordStep from "./steps/password"
import EmailStep from "./steps/email"
import TOSStep from "./steps/tos"

const steps = [
    UsernameStep,
    PasswordStep,
    EmailStep,
    TOSStep,
]

const RegisterForm = (props) => {
    const [finishing, setFinishing] = React.useState(false)
    const [finishError, setFinishError] = React.useState(false)
    const [finishSuccess, setFinishSuccess] = React.useState(false)

    const [stepsValues, setStepsValues] = React.useState({})
    const [step, setStep] = React.useState(0)

    const currentStepData = steps[step - 1]

    async function finish() {
        setFinishError(null)
        setFinishSuccess(false)
        setFinishing(true)

        const result = await AuthModel.register({
            username: stepsValues.username,
            password: stepsValues.password,
            email: stepsValues.email,
            tos: stepsValues.tos,
        }).catch((err) => {
            setFinishSuccess(false)
            setFinishing(false)
            setFinishError(err)
        })

        if (result) {
            setFinishing(false)
            setFinishSuccess(true)
        }
    }

    function nextStep(to) {
        setStep((prev) => {
            if (!to) {
                to = prev + 1
            }

            if (to === steps.length + 1) {
                finish()
                return prev
            }

            return to
        })
    }

    function prevStep() {
        setStep((prev) => {
            return prev - 1
        })
    }

    const updateStepValue = (value) => setStepsValues((prev) => {
        return {
            ...prev,
            [currentStepData.key]: value
        }
    })

    function canNextStep() {
        if (!currentStepData) {
            return true
        }

        if (!currentStepData.required) {
            return true
        }

        const currentStepValue = stepsValues[currentStepData.key]

        if (currentStepData.required) {
            if (!currentStepValue) {
                return false
            }
        }

        return true
    }

    return <div
        className={classnames(
            "register_form",
            {
                ["welcome_step"]: step === 0 && !finishing
            }
        )}
    >
        <div className="register_form_header-text">
            {
                !finishSuccess && !finishing && step === 0 && <>
                    <h1>👋 Hi! Nice to meet you</h1>
                    <p>Tell us some basic information to get started creating your account.</p>
                </>
            }

            {
                !finishSuccess && !finishing && step > 0 && <>
                    <h1>
                        {
                            currentStepData?.icon && createIconRender(currentStepData.icon)
                        }

                        {currentStepData?.title}
                    </h1>
                    <p>
                        {
                            typeof currentStepData?.description === "function" ?
                                currentStepData?.description() : currentStepData.description
                        }
                    </p>
                </>
            }
        </div>

        {
            !finishSuccess && !finishing && step > 0 && React.createElement(currentStepData.content, {
                onPressEnter: nextStep,
                currentValue: stepsValues[currentStepData.key],
                updateValue: updateStepValue,
            })
        }

        {
            finishing && <div className="register_form_creating">
                <Icons.LoadingOutlined />
                <h1>
                    Creating your account
                </h1>
            </div>
        }

        {
            finishSuccess && <div className="register_form_success">
                <Icons.CheckCircleOutlined />
                <h1>
                    Welcome abord!
                </h1>
                <p>
                    One last step, we need you to login with your new account.
                </p>

                <antd.Button
                    type="primary"
                    onClick={() => props.changeStage(0)}
                >
                    Go to login
                </antd.Button>
            </div>
        }

        {
            finishError && <antd.Alert
                type="error"
                message={finishError.message}
            />
        }

        {
            !finishSuccess && !finishing && <div className="register_form_actions">
                {
                    step === 0 &&
                    <antd.Button
                        onClick={() => props.changeStage(0)}
                    >
                        Cancel
                    </antd.Button>
                }
                {
                    step > 0 &&
                    <antd.Button
                        onClick={() => prevStep()}
                    >
                        Back
                    </antd.Button>
                }

                <antd.Button
                    type="primary"
                    onClick={() => nextStep()}
                    disabled={!canNextStep()}
                >
                    {
                        step === steps.length ? "Finish" : "Next"
                    }
                </antd.Button>
            </div>
        }
    </div>
}

export default RegisterForm