import * as ycore from 'ycore'
import localforage from 'localforage'

export const sdcp = {
  isset: (value) => {
    if (!value) return false
    ycore.sdcp.localforage.getItem(value)? true : false
  },
  set: (operator)  => {
      if (!operator) return false
      try {
        let a;
        let b; 

        let { callback, model } = operator
        const {key, value} = model
        if (!typeof key === 'string' || ! a instanceof String) return false
      
        a = ycore.sdcp.get(key)
        if (!a.isArray()) return false
        
        b = JSON.parse(a).concat(value)

        localforage.setItem(key, b)

      } catch (err) {
        console.log(err)
        return false
      }
  },
  get: (key) => {
    try {
      return localforage.getItem(key)
    } catch (err) {
      return false
    }
  },

}

export const cryptSDCP = {
  atob_parse: e => {
    if (e) {
      try {
        atob(e)
      } catch (err) {
        ycore.notify.error(err)
        ycore.router.go('login')
        return false
      }
      try {
        let decodedSDCP = atob(e)
        let parsedSDCP = JSON.parse(decodedSDCP)
        return parsedSDCP
      } catch (err) {
        ycore.notify.error(err)
        ycore.router.go('login')
        return false
      }
    }
    return false
  },
  valid: () => {
    const a = ycore.asyncSDCP.get()
    return a ? true : false
  },
}
