import mongoose from 'mongoose'
import { Schema } from 'mongoose'

function getSchemas() {
    const obj = Object()
    
    const _schemas = require("../schemas")
    Object.keys(_schemas).forEach(key => {
        obj[key] = Schema(_schemas[key])
    })

    return obj
}

const schemas = getSchemas()

export const Role = mongoose.model('Role', schemas.Role, 'roles')
export const User = mongoose.model('User', schemas.User, "accounts")
export const Session = mongoose.model('Session', schemas.Session, "sessions")