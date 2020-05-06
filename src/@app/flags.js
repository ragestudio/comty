// ERROR FLAGS CODES
const flags = {
    CRITICAL_ERROR: 1000,
    EXCEPTION_ERROR: 1010,
    WARNING_ERROR: 1020,

    API_FAIL: 100,
    API_BADRESPONSE: 110,
    API_BADCREDENTIAL: 120,
}

function flag_handle(flag, ...pass){
    if (!flag) return false
    switch (flag) {
        case flags.CRITICAL_ERROR:
            const CRITICAL_ERROR = `${flags.CRITICAL_ERROR} | ${JSON.stringify(...pass)}`
            console.error(CRITICAL_ERROR)
            throw new Error(CRITICAL_ERROR)   
        case flags.EXCEPTION_ERROR:
            const EXCEPTION_ERROR = `${flags.EXCEPTION_ERROR} | ${JSON.stringify(...pass)}`
            console.warn(EXCEPTION_ERROR)
            return
        case flags.WARNING_ERROR:
            const WARNING_ERROR = `${flags.WARNING_ERROR} | ${JSON.stringify(...pass)}`
            console.warn(WARNING_ERROR)
            return
        default:
            break;
    }
}

module.exports.flags = flags
module.exports.flags_handle = flag_handle