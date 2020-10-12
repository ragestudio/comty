import settings from 'core/libs/settings'
import { objectToArray } from 'core'
import stackTrace from 'stack-trace'
import path from 'path'
import colors from 'colors'
const verbosity_enabled = settings('verbosity')

export function verbosity(data, params, stackTraceParams){
  if(!verbosity_enabled) return false
  let initData;
  initData = data

  let opt = {
      color: "green",
      type: "log"
  }
  let optStackTrace = {
    activeColor: true,
    line: false,
    method: true,
    file: false,
    time: true
  }

  const frame = stackTrace.get()[1]

  const stackTraceData = {
      time: new Date().toLocaleTimeString(),
      line: `(:${frame.getLineNumber()})`,
      file: path.basename(frame.getFileName()),
      method: `[${frame.getFunctionName()}]`
  }

  if (typeof(params) !== "undefined" || params != null) {
    objectToArray(params).forEach((e) => {
      if(typeof(e.value) !== "undefined"){
        opt[e.key] = e.value
      }
    })
  }

  if (typeof(stackTraceParams) !== "undefined" || stackTraceParams != null) {
    objectToArray(stackTraceParams).forEach((e) => {
      if(typeof(e.value) !== "undefined"){
        optStackTrace[e.key] = e.value
      }
    })
  }
  
  if (opt.color) {
    colors.enable()
  }

  const stackTraceKeys = Object.keys(optStackTrace)
  const stackTraceLength = stackTraceKeys.length
  let modifyCount = 0
  let tmp

  for (let i = 0; i < stackTraceLength; i++) {
    const key = stackTraceKeys[i]
    const value = optStackTrace[stackTraceKeys[i]]
    const divisor = (i == (stackTraceLength - 1)? " | " : " > ")
    // console.log(`[${key}] is the ${i == stackTraceLength? "last opt" : `n[${i}]` }`)
    // console.log(i, "/", stackTraceLength -1)
    if(typeof(stackTraceData[key]) !== "undefined" && value){
      if (Array.isArray(initData)) {
        if (modifyCount == 0) {
          tmp = (`${stackTraceData[key]}`[opt.color] + divisor)
        }else{
          tmp = (`${stackTraceData[key]}`[opt.color] + divisor + tmp)
        }
        if (i == (stackTraceLength - 1)){
          data.unshift(tmp)
        }
      }else{
        data = (`${stackTraceData[key]}`[opt.color] + divisor + data)
      }
      modifyCount++
    }
  }

  if (Array.isArray(data)) {
    return console[opt.type](...data)
  }

  return console[opt.type](data)
}

export default verbosity