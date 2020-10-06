import settings from 'core/libs/settings'
import { objectToArray } from 'core'
import stackTrace from 'stack-trace'
import path from 'path'
const verbosity_enabled = settings('verbosity')

export function verbosity(data, params){
  if(!verbosity_enabled) return false
  let optString = []
  const frame = stackTrace.get()[1]
  const stackTraceData = {
      line: `(:${frame.getLineNumber()})`,
      file: path.basename(frame.getFileName()),
      method: `[${frame.getFunctionName()}]`,
  }

  let opt = {
      stackTrace: {
          method: true,
          line: false,
          file: false
      },
      color: "#bada55",
      type: "log", 
  }

  if (params) {
    opt = { ...opt, ...params }  
  }

  
  objectToArray(opt.stackTrace).forEach(e => {
      if (typeof e !== "undefined" && e) {
          if(e.value){
              optString.push(`${stackTraceData[e.key]} >`)
          }
      }
  })
  
  console[opt.type](`%c${optString}`, 'color: #bada55', data)
  
}

export default verbosity