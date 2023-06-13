import React from "react"
import UserModel from "models/user"
import loadable from "@loadable/component"
import UploadButton from "components/UploadButton"

export default {
    id: "profile",
    icon: "User",
    label: "Profile",
    group: "basic",
    ctxData: async () => {
        const userData = await UserModel.data()

        return {
            userData
        }
    },
    settings: [
        {
            id: "username",
            group: "account.basicInfo",
            component: "Button",
            icon: "AtSign",
            title: "Username",
            description: "Your username is the name you use to log in to your account.",
            props: {
                disabled: true,
                children: "Change username",
            },
        },
        {
            id: "fullName",
            group: "account.basicInfo",
            component: "Input",
            icon: "Edit3",
            title: "Name",
            description: "Change your public name",
            props: {
                // set max length
                "maxLength": 120,
                "showCount": true,
                "allowClear": true,
                "placeholder": "Enter your name. e.g. John Doe",
            },
            defaultValue: (ctx) => {
                return ctx.userData.fullName
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    fullName: value
                })

                if (result) {
                    return value
                }
            },
            extraActions: [
                {
                    "id": "unset",
                    "icon": "Delete",
                    "title": "Unset",
                    "onClick": async () => {
                        await UserModel.unsetFullName()
                    }
                }
            ],
            debounced: true,
            storaged: false,
        },
        {
            "id": "email",
            "group": "account.basicInfo",
            "component": "Input",
            "icon": "Mail",
            "title": "Email",
            "description": "Change your email address",
            "props": {
                "placeholder": "Enter your email address",
                "allowClear": true,
                "showCount": true,
                "maxLength": 320,
            },
            "defaultValue": (ctx) => {
                return ctx.userData.email
            },
            "onUpdate": async (value) => {
                const result = await UserModel.updateData({
                    email: value
                })

                if (result) {
                    return value
                }
            },
            "debounced": true,
        },
        {
            "id": "avatar",
            "group": "account.profile",
            "icon": "Image",
            "title": "Avatar",
            "description": "Change your avatar (Upload an image or use an URL)",
            "component": loadable(() => import("../components/urlInput")),
            extraActions: [
                UploadButton
            ],
            "defaultValue": (ctx) => {
                console.log(ctx)
                return ctx.userData.avatar
            },
            "onUpdate": async (value) => {
                const result = await UserModel.updateData({
                    avatar: value
                })

                if (result) {
                    app.message.success("Avatar updated")
                    return value
                }
            },
            "debounced": true,
        },
        {
            "id": "cover",
            "group": "account.profile",
            "icon": "Image",
            "title": "Cover",
            "description": "Change your profile cover (Upload an image or use an URL)",
            "component": loadable(() => import("../components/urlInput")),
            extraActions: [
                UploadButton
            ],
            "defaultValue": (ctx) => {
                return ctx.userData.cover
            },
            "onUpdate": async (value) => {
                const result = await UserModel.updateData({
                    cover: value
                })

                if (result) {
                    app.message.success("Cover updated")
                    return value
                }
            },
            "debounced": true,
        },
        {
            "id": "description",
            "group": "account.profile",
            "component": "TextArea",
            "icon": "Edit3",
            "title": "Description",
            "description": "Change your description for your profile",
            "props": {
                "placeholder": "Enter here a description for your profile",
                "maxLength": 1000,
                "showCount": true,
                "allowClear": true
            },
            "defaultValue": (ctx) => {
                return ctx.userData.description
            },
            "onUpdate": async (value) => {
                const result = await UserModel.updateData({
                    description: value
                })

                if (result) {
                    return value
                }
            },
            "debounced": true,
            storaged: false,
        },
        {
            id: "Links",
            group: "account.profile",
            component: loadable(() => import("../components/profileLinks")),
            icon: "MdLink",
            title: "Links",
            description: "Add links to your profile",
            onUpdate: async (value) => {
                // filter invalid links
                value = value.filter((link) => {
                    return link.key && link.value
                })

                const result = await UserModel.updateData({
                    links: value
                })

                if (result) {
                    return result.links
                }
            },
            defaultValue: (ctx) => {
                return ctx.userData.links ?? []
            },
            debounced: true,
            storaged: false,
        }
    ]
}