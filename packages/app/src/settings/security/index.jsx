import loadable from "@loadable/component"

export default {
    id: "security",
    icon: "Shield",
    label: "Security",
    group: "basic",
    settings: [
        {
            id: "change-password",
            group: "security.account",
            title: "Change Password",
            description: "Change your password",
            icon: "Lock",
            component: loadable(() => import("../components/changePassword")),
        },
        {
            id: "auth:mfa",
            group: "security.account",
            title: "2-Factor Authentication",
            description: "Use your email to validate logins to your account through a numerical code.",
            icon: "IoMdKeypad",
            component: "Switch",
            defaultValue: (ctx) => {
                return ctx.baseConfig["auth:mfa"]
            }
        },
        {
            id: "sessions",
            group: "security.account",
            title: "Sessions",
            description: "Manage your active sessions",
            icon: "Monitor",
            component: loadable(() => import("../components/sessions")),
        }
    ]
}