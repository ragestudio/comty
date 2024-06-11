import fs from "node:fs"
import path from "node:path"

import Handlebars from "handlebars"

export default {
    account_disabled: Handlebars.compile(fs.readFileSync(path.resolve(__dirname, "account_disabled/index.handlebars"), "utf-8")),
    new_login: Handlebars.compile(fs.readFileSync(path.resolve(__dirname, "new_login/index.handlebars"), "utf-8")),
    mfa_code: Handlebars.compile(fs.readFileSync(path.resolve(__dirname, "mfa_code/index.handlebars"), "utf-8")),
    password_recovery: Handlebars.compile(fs.readFileSync(path.resolve(__dirname, "password_recovery/index.handlebars"), "utf-8")),
    password_changed: Handlebars.compile(fs.readFileSync(path.resolve(__dirname, "password_changed/index.handlebars"), "utf-8")),
}