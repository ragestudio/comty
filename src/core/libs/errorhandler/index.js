import { notify } from 'core/libs/interface/notify'
import verbosity from 'core/libs/verbosity'

// STRINGS
export const OVERLAY_BADPOSITION = `Invalid overlay position! Was expected "primary" or "secondary"`
export const INTERNAL_PROCESS_FAILED = `An internal error has occurred! `
// HANDLERS
export const onError = {
    internal_proccess: (...rest) => {
        verbosity.error(...rest)
        notify.warn(INTERNAL_PROCESS_FAILED, ...rest)
        return false
    }
}