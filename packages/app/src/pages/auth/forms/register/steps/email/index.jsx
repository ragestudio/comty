import React from "react"
import * as antd from "antd"

import UserModel from "models/user"

const EmailStepComponent = (props) => {
    const [email, setEmail] = React.useState(props.currentValue ?? "")

    const [loading, setLoading] = React.useState(false)
    const [validFormat, setValidFormat] = React.useState(null)
    const [emailAvailable, setEmailAvailable] = React.useState(null)

    const isValid = () => {
        return email.length > 0 && validFormat && emailAvailable
    }

    const checkIfIsEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const submit = () => {
        if (!isValid()) return

        props.onPressEnter()
    }

    const handleUpdate = (e) => {
        setEmail(e.target.value)
    }

    React.useEffect(() => {
        if (email.length === 0) {
            setEmailAvailable(null)
            setValidFormat(null)

            return
        }

        props.updateValue(null)

        setLoading(true)

        setValidFormat(checkIfIsEmail(email))

        // check if email is available
        const timer = setTimeout(async () => {
            if (!validFormat) return

            const request = await UserModel.checkEmailAvailability(email).catch((error) => {
                antd.message.error(`Cannot check email availability: ${error.message}`)

                return false
            })

            if (request) {
                setEmailAvailable(request.available)

                if (!request.available) {
                    antd.message.error("Email is already in use")
                    props.updateValue(null)
                } else {
                    props.updateValue(email)
                }
            }

            setLoading(false)
        }, 1000)

        return () => clearTimeout(timer)
    }, [email])

    return <div className="register_form_step_content">
        <antd.Input
            defaultValue={props.currentValue}
            placeholder="Email"
            onPressEnter={submit}
            onChange={handleUpdate}
            status={email.length == 0 ? "default" : loading ? "default" : (isValid() ? "success" : "error")}
        />
    </div>
}

export default {
    key: "email",
    title: "Step 3",
    icon: "Mail",
    description: "Enter a email for the account, it can be used to access to your account. \n Will not be shared with anyone else and not be used for marketing purposes.",
    required: true,
    content: EmailStepComponent,
}