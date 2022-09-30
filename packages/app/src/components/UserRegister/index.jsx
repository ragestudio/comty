import React from "react"
import * as antd from "antd"
import { StepsForm } from "components"

import UserModel from "models/user"

import "./index.less"

const steps = [
    {
        key: "username",
        title: "Step 1",
        icon: "User",
        description: "Enter the username for the account",
        required: true,
        content: (props) => {
            return <div className="workorder_creator steps step content">
                <antd.Input
                    autoCorrect="off"
                    autoCapitalize="none"
                    onPressEnter={props.onPressEnter}
                    placeholder="@newuser"
                    onChange={(e) => {
                        props.handleUpdate(e.target.value)
                    }}
                />
            </div>
        },
    },
    {
        key: "password",
        title: "Step 2",
        icon: "Key",
        description: "Enter a password for the account",
        required: true,
        content: (props) => {
            return <div className="workorder_creator steps step content">
                <antd.Input.Password
                    autoCorrect="off"
                    autoCapitalize="none"
                    onPressEnter={props.onPressEnter}
                    placeholder="Password"
                    onChange={(e) => {
                        props.handleUpdate(e.target.value)
                    }}
                />
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
            return <div className="workorder_creator steps step content">
                <antd.Input
                    onPressEnter={props.onPressEnter}
                    placeholder="Email"
                    onChange={(e) => {
                        props.handleUpdate(e.target.value)
                    }}
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