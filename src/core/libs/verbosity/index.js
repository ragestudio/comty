import { storage } from 'core/libs/settings'
import stackTrace from 'stack-trace'
// import path from 'path'
const verbosity_enabled = storage.get('verbosity')

const verbosity = {
  log: (...cont) => {
    return verbosity_enabled ? console.log(...cont) : null
  },
  debug: (...cont) => {
    const frame = stackTrace.get()[1]
    // const line = frame.getLineNumber()
    // const file = path.basename(frame.getFileName())
    const method = frame.getFunctionName()

    return verbosity_enabled ? console.debug(`%c[${method}]`, 'color: #bada55', ...cont) : null
  },
  error: (...cont) => {
    const frame = stackTrace.get()[1]
    // const line = frame.getLineNumber()
    // const file = path.basename(frame.getFileName())
    const method = frame.getFunctionName()

    return verbosity_enabled ? console.error(`%c[${method}]`, 'color: #bada55', ...cont) : null
  },
  warn: (...cont) => {
    return verbosity_enabled ? console.warn(...cont) : null
  },
}

export default verbosity