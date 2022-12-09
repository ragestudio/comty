import React from "react"
import loadable from "@loadable/component"

// TODO: Make logout button require a valid session to be not disabled

export default [
    {
        "id": "change-password",
        "group": "security.account",
        "title": "Change Password",
        "description": "Change your password",
        "icon": "Lock",
        "component": loadable(() => import("../components/changePassword")),
    },
    {
        "id": "two-factor-authentication",
        "group": "security.account",
        "title": "Two-Factor Authentication",
        "description": "Add an extra layer of security to your account",
        "icon": "MdOutlineSecurity",
        "component": "Switch",
    },
    {
        "id": "sessions",
        "group": "security.account",
        "title": "Sessions",
        "description": "Manage your active sessions",
        "icon": "Monitor",
        "component": loadable(() => import("../components/sessions")),
    },
    {
        "id": "logout",
        "group": "security.other",
        "component": "Button",
        "icon": "LogOut",
        "title": "Logout",
        "description": "Logout from your account",
        "emitEvent": "session.logout",
    }
]