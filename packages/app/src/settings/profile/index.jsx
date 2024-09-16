import loadable from "@loadable/component"
import UserModel from "@models/user"
import UploadButton from "@components/UploadButton"

export default {
    id: "profile",
    icon: "FiUser",
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
            icon: "FiAtSign",
            title: "Username",
            description: "Your username is the name you use to log in to your account.",
            props: {
                disabled: true,
                children: "Change username",
            },
        },
        {
            id: "public_name",
            group: "account.basicInfo",
            component: "Input",
            icon: "FiEdit3",
            title: "Name",
            description: "Change your public name",
            props: {
                maxLength: 120,
                showCount: true,
                allowClear: true,
                placeholder: "Enter your name. e.g. John Doe",
            },
            defaultValue: (ctx) => {
                return ctx.userData.public_name
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    public_name: value
                })

                if (result) {
                    app.message.success("Public name updated")
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
            id: "email",
            group: "account.basicInfo",
            component: "Input",
            icon: "FiMail",
            title: "Email",
            description: "Change your email address",
            props: {
                placeholder: "Enter your email address",
                allowClear: true,
                showCount: true,
                maxLength: 320,
            },
            defaultValue: (ctx) => {
                return ctx.userData.email
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    email: value
                })

                if (result) {
                    return value
                }
            },
            debounced: true,
        },
        {
            id: "avatar",
            group: "account.profile",
            icon: "FiImage",
            title: "Avatar",
            description: "Change your avatar (Upload an image or use an URL)",
            component: loadable(() => import("../components/urlInput")),
            extraActions: [
                UploadButton
            ],
            defaultValue: (ctx) => {
                return ctx.userData.avatar
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    avatar: value
                })

                if (result) {
                    app.message.success("Avatar updated")
                    return value
                }
            },
        },
        {
            id: "cover",
            group: "account.profile",
            icon: "FiImage",
            title: "Cover",
            description: "Change your profile cover (Upload an image or use an URL)",
            component: loadable(() => import("../components/urlInput")),
            extraActions: [
                UploadButton
            ],
            defaultValue: (ctx) => {
                return ctx.userData.cover
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    cover: value
                })

                if (result) {
                    app.message.success("Cover updated")
                    return value
                }
            },
        },
        {
            id: "description",
            group: "account.profile",
            component: "TextArea",
            icon: "FiEdit3",
            title: "Description",
            description: "Change your description for your profile",
            props: {
                placeholder: "Enter here a description for your profile",
                maxLength: 320,
                showCount: true,
                allowClear: true
            },
            defaultValue: (ctx) => {
                return ctx.userData.description
            },
            onUpdate: async (value) => {
                const result = await UserModel.updateData({
                    description: value
                })

                if (result) {
                    return value
                }
            },
            debounced: true,
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
        }
    ]
}