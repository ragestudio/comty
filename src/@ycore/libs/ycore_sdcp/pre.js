import * as ycore from 'ycore'
import localforage from 'localforage'

export const asyncSDCP = {
  setSDCP: function(value) {
    return Promise.resolve().then(function() {
      localforage.setItem('SDCP', value)
    })
  },
  getRaw: () => {
    try {
      return localforage.getItem('SDCP')
    } catch (err) {
      return false
    }
  },
  get: callback => {
    try {
      const a = ycore.asyncSDCP.getRaw((err, value) => {
        const b = ycore.cryptSDCP.atob_parse(value)
        return callback(null, b)
      })
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
        ycore.router.push({
          pathname: '/login',
        })
        return false
      }
      try {
        let decodedSDCP = atob(e)
        let parsedSDCP = JSON.parse(decodedSDCP)
        return parsedSDCP
      } catch (err) {
        ycore.notify.error(err)
        ycore.router.push({
          pathname: '/login',
        })
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
