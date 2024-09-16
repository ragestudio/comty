import React from "react"
import * as antd from "antd"

import "./index.less"

export const PasswordStepComponent = (props) => {
    const confirmRef = React.useRef(null)

    const [password, setPassword] = React.useState(props.currentValue ?? "")
    const [confirmedPassword, setConfirmedPassword] = React.useState(props.currentValue ?? "")
    const [passwordStrength, setPasswordStrength] = React.useState(null)

    const passwordMinimunStrength = 3
    const passwordsMatch = password === confirmedPassword
    const passwordError = !passwordsMatch && confirmedPassword.length > 0

    const submit = () => {
        if (!passwordError) {
            props.onPressEnter()
        }
    }

    const passwordStrengthCalculator = (password) => {
        let strength = 0

        if (password.length === 0 || password.length < 8) {
            return strength
        }

        strength += 1

        if (password.length >= 12) {
            strength += 1
        }

        if (password.match(/[a-z]/)) {
            strength += 1
        }

        if (password.match(/[A-Z]/)) {
            strength += 1
        }

        if (password.match(/[0-9]/)) {
            strength += 1
        }

        if (password.match(/[^a-zA-Z0-9]/)) {
            strength += 1
        }

        return strength
    }

    React.useEffect(() => {
        const calculatedStrength = passwordStrengthCalculator(password)

        setPasswordStrength(calculatedStrength)

        if (password !== confirmedPassword) {
            props.updateValue(null)
        }

        if (calculatedStrength < passwordMinimunStrength) {
            props.updateValue(null)
        }

        if (calculatedStrength >= passwordMinimunStrength && password === confirmedPassword) {
            props.updateValue(password)
        }
    }, [password, confirmedPassword])

    return <div className="register_form_step_content, passwords_fields">
        <antd.Input.Password
            className="password"
            placeholder="Password"
            autoCorrect="off"
            autoCapitalize="none"
            defaultValue={props.currentValue}
            onPressEnter={() => {
                confirmRef.current.focus()
            }}
            onChange={(e) => {
                setPassword(e.target.value)
            }}
            status={passwordError ? "error" : "success"}
            autoFocus
        />

        <antd.Input.Password
            className="password"
            placeholder="Confirm Password"
            ref={confirmRef}
            autoCorrect="off"
            autoCapitalize="none"
            defaultValue={props.currentValue}
            onPressEnter={submit}
            status={passwordError ? "error" : "success"}
            onChange={(e) => {
                setConfirmedPassword(e.target.value)
            }}
        />

        <antd.Progress
            percent={passwordStrength * 20}
            status={passwordStrength < passwordMinimunStrength ? "exception" : "success"}
            showInfo={false}
        />

        <div className="passwordPolicy">
            <p>Password must be at least 8 characters long.</p>
            <p>Password must contain at least one number.</p>
        </div>
    </div>
}


export default {
    key: "password",
    title: "Step 2",
    icon: "FiKey",
    description: "Enter a password for the account. must comply with the password requirements policy.",
    required: true,
    content: PasswordStepComponent,
}
