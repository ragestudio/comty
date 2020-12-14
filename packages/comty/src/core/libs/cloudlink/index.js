import verbosity from 'core/libs/verbosity'
import handle from 'core/libs/errorhandler'
import { notify } from 'core/libs/ui'
import settings from 'core/libs/settings'
import endpoints from 'config/endpoints'
import { v3_model } from 'core/libs'

import { getRuntime } from '@nodecore/dot-runtime'

export function NewFunction(payload, callback){
    if (!payload) return false
    const { data } = payload
        
    return callback(false, null)
}

export const ObjectFunction = {
    something: (payload, callback) => {
        return callback(false, null)
    }
}

export default NewFunction