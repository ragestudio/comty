import settings from 'core/libs/settings'
import { objectToArray } from 'core'
import stackTrace from 'stack-trace'
import path from 'path'
const verbosity_enabled = settings('verbosity')

export function verbosity(data, params){
  if(!verbosity_enabled) return false
  let renderOpt = []
  let opt = {
      stackTrace: {
          method: true,
          line: false,
          file: false,
          time: true
      },
      color: "#bada55",
      type: "log", 
  }

  const frame = stackTrace.get()[1]
  const stackTraceData = {
      time: new Date().toLocaleTimeString(),
      line: `(:${frame.getLineNumber()})`,
      file: path.basename(frame.getFileName()),
      method: `%c [${frame.getFunctionName()}]`
  }

  if (params) {
    opt = { ...opt, ...params }  
  }

  objectToArray(opt.stackTrace).forEach(e => {
      if (typeof e !== "undefined" && e) {
          if(e.value){
            renderOpt.push(stackTraceData[e.key])
          }
      }
  })

  renderOpt? renderOpt.push(" >") : null

  if (Array.isArray(data)){
    return console[opt.type](renderOpt.toString(), `color: ${opt.color}`, ...data)
  }
  
  return console[opt.type](`%c${renderOpt}`, `color: ${opt.color}`, data)
}

export default verbosity