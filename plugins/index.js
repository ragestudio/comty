import verbosity from 'core/libs/verbosity';

const http = require('http')
  , vm = require('vm')
  , concat = require('concat-stream') 
  , async = require('async'); 

export function http_require(url, callback) {
  http.get(url, function(res) {
    // console.log('fetching: ' + url)
    res.setEncoding('utf8');
    res.pipe(concat({encoding: 'string'}, function(data) {
      callback(null, vm.runInThisContext(data));
    }));
  })
}

export function usePlugins(array, callback){
  async.map(array, http_require, function(err, results) {
    // `results` is an array of values returned by `runInThisContext`
    // the rest of your program logic
    if(callback){
      callback(err, results)
    }
  })
}