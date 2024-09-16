import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import AuthModel from "@models/auth"

export const UsernameStepComponent = (props) => {
    const [loading, setLoading] = React.useState(false)
    const [username, setUsername] = React.useState(props.currentValue ?? "")

    const [validLength, setValidLength] = React.useState(props.currentValue ? true : null)
    const [validCharacters, setValidCharacters] = React.useState(props.currentValue ? true : null)
    const [usernameAvailable, setUsernameAvailable] = React.useState(props.currentValue ? true : null)

    const isValid = () => {
        return username.length > 0 && validCharacters && usernameAvailable
    }

    const hasValidCharacters = (username) => {
        return /^[a-z0-9_]+$/.test(username)
    }

    const submit = () => {
        if (!isValid()) return

        props.onPressEnter()
    }

    const handleUpdate = (e) => {
        if (e.target.value === " ") {
            return
        }

        e.target.value = e.target.value.toLowerCase()

        setUsername(e.target.value)
    }

    const renderIndicator = (value, label) => {
        if (loading) {
            return <>
                <Icons.LoadingOutlined
                    style={{
                        color: "var(--text-color)"
                    }}
                />
                <p>{label}</p>
            </>
        }

        if (value) {
            return <>
                <Icons.CheckCircleOutlined
                    style={{
                        color: "#99F7AB"
                    }}
                />
                <p>{label}</p>
            </>
        }

        return <>
            <Icons.CloseCircleOutlined
                style={{
                    color: "var(--text-color)"
                }}
            />
            <p>{label}</p>
        </>
    }

    React.useEffect(() => {
        if (username.length < 3) {
            setUsernameAvailable(null)
            setValidCharacters(null)
            setValidLength(false)

            setLoading(false)

            return
        } else {
            setValidLength(true)
        }

        props.updateValue(null)

        setLoading(true)

        setValidCharacters(hasValidCharacters(username))

        const timer = setTimeout(async () => {
            if (!validCharacters) {
                setLoading(false)
                return
            }

            const request = await AuthModel.availability({ username }).catch((error) => {
                app.message.error(`Cannot check username availability: ${error.message}`)
                console.error(error)

                return false
            })

            console.log(request)

            if (request) {
                setUsernameAvailable(!request.exists)

                if (request.exists) {
                    props.updateValue(null)
                } else {
                    props.updateValue(username)
                }
            }

            setLoading(false)
        }, 1000)

        return () => clearTimeout(timer)
    }, [username])

    return <div className="register_form_step_content">
        <antd.Input
            autoCorrect="off"
            autoCapitalize="none"
            onPressEnter={submit}
            placeholder="newuser"
            value={username}
            onChange={handleUpdate}
            status={username.length == 0 ? "default" : loading ? "default" : (isValid() ? "success" : "error")}
            maxLength={64}
        />

        <div className="usernameValidity">
            <div className="check">
                {
                    renderIndicator(validLength, "At least 3 characters / Maximum 64 characters")
                }
            </div>
            <div className="check">
                {
                    renderIndicator(usernameAvailable, "Username available")
                }
            </div>
            <div className="check">
                {
                    renderIndicator(validCharacters, "Valid characters (letters, numbers, underscores)")
                }
            </div>
        </div>
    </div>
}

export default {
    key: "username",
    title: "Step 1",
    icon: "FiUser",
    description: () => <div>
        <p>Enter your username you gonna use for your account, its used to access to your account and give a easy name to identify you.</p>
        <p>You can set a diferent public name for your account after registration.</p>
    </div>,
    required: true,
    content: UsernameStepComponent,
}