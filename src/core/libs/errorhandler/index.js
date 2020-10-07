import { appInterface } from 'core/libs'
import verbosity from 'core/libs/verbosity'

// STRINGS
export const OVERLAY_BADPOSITION = `Invalid overlay position! Was expected "primary" or "secondary"`
export const INTERNAL_PROCESS_FAILED = `An internal error has occurred! `
export const INVALID_DATA = `A function has been executed with invalid data and has caused an error!`
export const INVALID_PROPS = `Some props failed!`
// HANDLERS
export const onError = {
    internal_proccess: (...rest) => {
        verbosity({...rest}, {
            type: "error"
        })
        appInterface.notify.open({
            message: INTERNAL_PROCESS_FAILED,
            description:
            <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto' }}>
                <div style={{ margin: '10px 0' }}> {JSON.stringify(...rest)} </div>
            </div>,
           
          })
        return false
    },
    invalid_data: (error, expecting) => {
        verbosity({error}, {
            type: "error"
        })
        appInterface.notify.open({
            message: 'Invalid Data',
            description:
            <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto' }}>
                <div style={{ margin: '10px 0' }}> {INVALID_DATA} </div>
                <div style={{ margin: '10px 0', color: '#333' }}>
                     <h4>Expected: {expecting}</h4>
                     <h4 style={{ backgroundColor: 'rgba(221, 42, 42, 0.8)' }} >{`${error}`} </h4>
                </div>
            </div>,
           
          })
        return false
    }
}