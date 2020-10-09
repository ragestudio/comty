import { appInterface } from 'core/libs'
import verbosity from 'core/libs/verbosity'
import errStrings from 'config/handlers/errToStrings.js'
import errNumbers from 'config/handlers/numToError.js'
import errFlags from  'config/handlers/errToFlag.js'

export function ErrorHandler(payload, callback){
    if (!payload) {
        return false
    }

    const flagToString = {
        CRITICAL: "An critical exception",
        DISRUPT: "An wild error appears!",
        IGNORE: "Warning"
    }

    const flags = ["CRITICAL", "DISRUPT", "IGNORE"]
    let flag = null
    let out = null

    const { msg, outFlag, code } = payload
    
    if (!out && code != null) { // This give priority to resolve with `code` than `outFlag` 
        out = errNumbers[code]
    }

    if (!out && outFlag != null ) {
        out = outFlag
    }

    if (out && typeof(errStrings[out]) !== "undefined") {
        verbosity(msg, {type: "error"})
        flag = errFlags[out]
    }else{
        console.log("(Aborted) no out key | or invalid flag => ", out)
        return false
    }

    appInterface.notify.open({
      message: flagToString[flag] ?? "Unexpected Error",
      description:
      <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto', height: "auto" }}>
          <div style={{ margin: '10px 0' }}> {msg ?? "No exception message"} </div>
          <div> => {errStrings[out] ?? "Unhandled Exception"} | { out?? "UNDEFINED_KEY" } </div>
      </div>,
    })

    switch (flag) {
        case flags[0]:
            console.log("FLAG => ", flags[0])
            return false
        case flags[1]:
            console.log("FLAG => ", flags[1])
            return false
        case flags[2]:
            console.log("FLAG => ", flags[2])
            return false
        default:
            console.log('Invalid FLAG')
            break;
    }
}


export default ErrorHandler