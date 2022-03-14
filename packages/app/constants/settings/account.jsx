import React from "react"
import { User } from "models"

export default [
    {
        "id": "username",
        "group": "account.basicInfo",
        "type": "Button",
        "icon": "AtSign",
        "title": "Username",
        "description": "Your username is the name you use to log in to your account.",
        "props": {
            "disabled": true,
            "children": "Change username",
        },
    },
    {
        "id": "fullName",
        "group": "account.basicInfo",
        "type": "Input",
        "icon": "Edit3",
        "title": "Name",
        "description": "Change your public name",
        "props": {
            "placeholder": "Enter your name. e.g. John Doe",
        },
        "defaultValue": async () => {
            const userData = await User.data()
            return userData.fullName
        },
        "onUpdate": async (value) => {
            const selfId = await User.selfUserId()

            const result = window.app.request.post.updateUser({
                _id: selfId,
                update: {
                    fullName: value
                }
            })

            if (result) {
                return result
            }
        },
        "extraActions": [
            {
                "id": "unset",
                "icon": "Delete",
                "title": "Unset",
                "onClick": async () => {
                    window.app.request.post.unsetPublicName()
                }
            }
        ],
        "debounced": true,
    },
    {
        "id": "email",
        "group": "account.basicInfo",
        "type": "Input",
        "icon": "Mail",
        "title": "Email",
        "description": "Change your email address",
        "props": {
            "placeholder": "Enter your email address",
        },
        "defaultValue": async () => {
            const userData = await User.data()
            return userData.email
        },
        "onUpdate": async (value) => {
            const selfId = await User.selfUserId()

            const result = window.app.request.post.updateUser({
                _id: selfId,
                update: {
                    email: value
                }
            })

            if (result) {
                return result
            }
        },
        "debounced": true,
    },
    {
        "id": "Avatar",
        "group": "account.basicInfo",
        "type": "ImageUpload",
        "icon": "Image",
        "title": "Avatar",
        "description": "Change your avatar",
    },
    {
        "id": "primaryBadge",
        "group": "account.basicInfo",
        "type": "Select",
        "icon": "Tag",
        "title": "Primary badge",
        "description": "Change your primary badge",
    },
]