import { appInterface } from 'core/libs'
import verbosity from 'core/libs/verbosity'
import errStrings from 'config/handlers/errToStrings.js'
import errNumbers from 'config/handlers/numToError.js'
import errFlags from  'config/handlers/errToFlag.js'
import flagToBehavior from 'config/handlers/flagToBehavior.js'

const flagToString = {
    CRITICAL: "An critical exception",
    DISRUPT: "An wild error appears!",
    IGNORE: "Warning"
}

export function notifyErrorHandler(params) {
    if (!params) {
        return false
    }
    appInterface.notify.open({
      message: flagToString[params.flag] ?? "Unexpected Error",
      description:
      <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto', height: "auto" }}>
          <div style={{ margin: '10px 0' }}> {params.msg ?? "No exception message"} </div>
          <div> => {errStrings[params.out] ?? "Unhandled Exception"} | { params.out?? "UNDEFINED_KEY" } </div>
      </div>,
    })
}

export function ErrorHandler(payload, callback){
    if (!payload) {
        return false
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

    verbosity(msg?? "unhandled message", {type: "error"})

    if (out && typeof(errStrings[out]) !== "undefined") {
        flag = errFlags[out]
    }else{
        console.log("(Aborted) no out key | or invalid flag => ", out)
        return false
    }

    switch (flag) {
        case flags[0]:
            notifyErrorHandler({ msg, out, flag })
            flagToBehavior[out]({ msg, out, flag, code })
            return false
        case flags[1]:
            flagToBehavior[out]({ msg, out, flag, code })
            return false
        case flags[2]:
            flagToBehavior[out]({ msg, out, flag, code })
            return false
        default:
            console.log('Invalid FLAG')
            break;
    }
}


export default ErrorHandler