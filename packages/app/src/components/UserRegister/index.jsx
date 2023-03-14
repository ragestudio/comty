import React from "react"
import * as antd from "antd"

import UserModel from "models/user"

import { StepsForm } from "components"
import { Icons } from "components/Icons"

import "./index.less"

const steps = [
    {
        key: "username",
        title: "Step 1",
        icon: "User",
        description: () => <div>
            <p>Enter your username you gonna use for your account, its used to access to your account.</p>
            <p>It must be unique, on lower case, and contain only accepted characters as letters, numbers, underscores.</p>
        </div>,
        required: true,
        content: (props) => {
            const [loading, setLoading] = React.useState(false)
            const [username, setUsername] = React.useState("")
            const [validCharacters, setValidCharacters] = React.useState(null)
            const [usernameAvailable, setUsernameAvailable] = React.useState(null)

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
                        <Icons.LoadingOutlined />
                        <p>{label}</p>
                    </>
                }

                if (value) {
                    return <>
                        <Icons.CheckCircleOutlined />
                        <p>{label}</p>
                    </>
                }

                return <>
                    <Icons.CloseCircleOutlined />
                    <p>{label}</p>
                </>
            }

            React.useEffect(() => {
                if (username.length === 0) {
                    setUsernameAvailable(null)
                    setValidCharacters(null)
                    setLoading(false)

                    return
                }

                props.handleUpdate(null)

                setLoading(true)

                setValidCharacters(hasValidCharacters(username))

                const timer = setTimeout(async () => {
                    if (!validCharacters) {
                        setLoading(false)
                        return
                    }

                    const request = await UserModel.checkUsernameAvailability(username).catch((error) => {
                        antd.message.error(`Cannot check username availability: ${error.message}`)

                        return false
                    })

                    if (request.data) {
                        setUsernameAvailable(request.data.available)

                        if (!request.data.available) {
                            props.handleUpdate(null)
                        } else {
                            props.handleUpdate(username)
                        }
                    }

                    setLoading(false)
                }, 1000)

                return () => clearTimeout(timer)
            }, [username])

            return <div className="steps step content">
                <antd.Input
                    autoCorrect="off"
                    autoCapitalize="none"
                    onPressEnter={submit}
                    placeholder="newuser"
                    value={username}
                    onChange={handleUpdate}
                    status={username.length == 0 ? "default" : loading ? "default" : (isValid() ? "success" : "error")}
                />

                <div className="usernameValidity">
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
        },
    },
    {
        key: "password",
        title: "Step 2",
        icon: "Key",
        description: "Enter a password for the account. must comply with the password requirements policy.",
        required: true,
        content: (props) => {
            const confirmRef = React.useRef(null)

            const [password, setPassword] = React.useState("")
            const [confirmedPassword, setConfirmedPassword] = React.useState("")
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
                    props.handleUpdate(null)
                }

                if (calculatedStrength < passwordMinimunStrength) {
                    props.handleUpdate(null)
                }

                if (calculatedStrength >= passwordMinimunStrength && password === confirmedPassword) {
                    props.handleUpdate(password)
                }
            }, [password, confirmedPassword])

            return <div className="steps step content passwordsInput">
                <antd.Input.Password
                    className="password"
                    placeholder="Password"
                    autoCorrect="off"
                    autoCapitalize="none"
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
        },
    },
    {
        key: "email",
        title: "Step 3",
        icon: "Mail",
        description: "Enter a email for the account",
        required: true,
        content: (props) => {
            const [email, setEmail] = React.useState("")

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

                props.handleUpdate(null)

                setLoading(true)

                setValidFormat(checkIfIsEmail(email))

                // check if email is available
                const timer = setTimeout(async () => {
                    if (!validFormat) return

                    const request = await UserModel.checkEmailAvailability(email).catch((error) => {
                        antd.message.error(`Cannot check email availability: ${error.message}`)

                        return false
                    })

                    if (request.data) {
                        setEmailAvailable(request.data.available)

                        if (!request.data.available) {
                            antd.message.error("Email is already in use")
                            props.handleUpdate(null)
                        } else {
                            props.handleUpdate(email)
                        }
                    }

                    setLoading(false)
                }, 1000)

                return () => clearTimeout(timer)
            }, [email])

            return <div className="steps step content">
                <antd.Input
                    placeholder="Email"
                    onPressEnter={submit}
                    onChange={handleUpdate}
                    status={email.length == 0 ? "default" : loading ? "default" : (isValid() ? "success" : "error")}
                />
            </div>
        },
    },
]

export default (props) => {
    const onSubmit = async (values) => {
        const result = await UserModel.register(values).catch((error) => {
            throw new Error(`Failed to register user: ${error.message}`)
        })

        if (result) {
            antd.message.success("User registered successfully.")
        }

        if (typeof props.close === "function") {
            props.close()
        }
    }

    return <StepsForm
        steps={steps}
        onSubmit={onSubmit}
    />
}