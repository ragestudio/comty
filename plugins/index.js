const http = require('http')
const vm = require("vm")
const concat =  require("concat-stream")
const async = require("async")

export function http_require(url, callback) {
  http.get(url, (res) => {
    res.setEncoding('utf8')
    res.pipe(concat({encoding: 'string'}, function(data) {
      callback(null, vm.runInThisContext(data))
    }))
  })
}

export function usePlugins(array, callback){
  async.map(array, http_require, function(err, results) {
    if(callback){
      callback(err, results)
    }
  })
}