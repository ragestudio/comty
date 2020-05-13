import * as Endpoints from 'globals/endpoints/index.js'
import * as Icons from 'components/Icons'

import localforage from 'localforage'
import { format } from 'timeago.js'
import * as antd from 'antd'
import moment from 'moment'

import config from 'config'
import './libs.js'

export * from '../../config/app.settings.js'
export * from './libs.js'
export * from 'utils'

export const package_json = require('../../package.json')
export const UUAID = `${package_json.name}==${package_json.UUID}`
export const endpoints = Endpoints

const prefix = package_json.name

export const AppInfo = {
  apid: package_json.name,
  stage: package_json.stage,
  name: package_json.title,
  version: package_json.version,
  logo: config.FullLogoPath,
  logo_dark: config.DarkFullLogoPath,
}

localforage.config({
  name: UUAID,
  version: 1.0,
  size: 4980736,
  storeName: package_json.name,
})

/**
 * Convert a base64 string in a Blob according to the data and contentType.
 *
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @return Blob
 */
export function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || ''
  sliceSize = sliceSize || 512

  var byteCharacters = atob(b64Data)
  var byteArrays = []

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize)

    var byteNumbers = new Array(slice.length)
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    var byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }

  var blob = new Blob(byteArrays, { type: contentType })
  return blob
}

/**
 * Convert a file in a B64 string according to the file.
 *
 * @param file {object} Raw File object
 * @return b64 {string}
 */
export function ReadFileAsB64(file, callback) {
  if (file) {
    var reader = new FileReader()
    reader.onload = function(readerEvt) {
      var binaryString = readerEvt.target.result
      const a = `data:image/png;base64, ${btoa(binaryString)}`
      return callback(a)
    }
    reader.readAsBinaryString(file)
  }
}

/**
 * Handle temporal file uploads
 *
 * @param file {object} Raw File object
 * @return boolean
 */
export function uploadFile(file) {
  var formData = new FormData()
  formData.append('userfile', file)
  var request = new XMLHttpRequest()
  request.onload = function() {
    if (request.status == 200) {
      return true
    } else {
      alert('Error! Upload failed')
    }
  }
  request.open('POST', '/temp/file')
  request.send(formData)
}

/**
 * Return the value of an object from array
 *
 * @param payload {object} data: (array) | key: (string for return the value)
 * @return {string} Boolean value
 */
export function ReturnValueFromMap(payload) {
  if (!payload) return false
  const { data, key } = payload
  try {
    const a = data.map(item => {
      return item.key === key ? item.value : null
    })
    const b = a.filter(Boolean)
    return b.toString()
  } catch (error) {
    return false
  }
}

/**
 * (HELPER) Convert the localStorage values (AppSettings) parsed
 *
 * @param e {String} String of SettingID for search
 * @return {string} Boolean value
 */
export function SettingStoragedValue(e) {
  try {
    const fromStorage = JSON.parse(localStorage.getItem('app_settings'))
    const Ite = fromStorage.map(item => {
      return item.SettingID === e ? item.value : null
    })
    const fr = Ite.filter(Boolean)
    return fr.toString()
  } catch (error) {
    return null
  }
}

/**
 * Return the last object from array
 *
 * @param array {array}
 * @return object
 */
export function objectLast(array, n) {
  if (array == null) return void 0
  if (n == null) return array[array.length - 1]
  return array.slice(Math.max(array.length - n, 0))
}

/**
 * Remove an element by id from an array
 *
 * @param array {array}
 * @param value {string}
 * @return object
 */
export function arrayRemoveByID(arr, value) {
  return arr.filter(function(ele) {
    return ele.id != value
  })
}
/**
 * Remove an element by key from an array
 *
 * @param array {array}
 * @param value {string}
 * @return object
 */
export function arrayRemoveByKEY(arr, value) {
  return arr.filter(function(ele) {
    return ele.key != value
  })
}

/**
 * Global fix for convert '1, 0' to string boolean 'true, false'
 *
 * @param e {int} Numeric boolean reference
 * @return {bool} Boolean value
 */
export function booleanFix(e) {
  if (e == 1) return true
  return false
}


/**
 * Handle time basic functions
 *
 */
export const time = {
  ago: a => {
    const format = moment(a).format('DDMMYYYY')
    const b = new Date(format).toLocaleString()
    return time.relativeToNow(b)
  },
  stmToAgo: a => {
    const b = a * 1000
    return format(b)
  },
  relativeToNow: (a, b) => {
    return moment(a, b || 'DDMMYYYY').fromNow()
  },
}


/**
 * User console with setting user permissions
 *
 * @param ... {any} Use for type of console
 */
export const yconsole = {
  log: (...cont) => {
    SettingStoragedValue('force_showDevLogs') ? console.log(...cont) : null
    return
  },
  debug: (...cont) => {
    SettingStoragedValue('force_showDevLogs') ? console.debug(...cont) : null
    return
  },
  error: (...cont) => {
    SettingStoragedValue('force_showDevLogs') ? console.error(...cont) : null
    return
  },
  warn: (...cont) => {
    SettingStoragedValue('force_showDevLogs') ? console.warn(...cont) : null
    return
  },
}

export const __yconsole = {
  showLogs: SettingStoragedValue('force_showDevLogs')? true : false,
  log: (...cont) => {
    console.log(...cont)
    logger.consoles.indexeddb.log(...cont);
  },
  debug: (...cont) => {
    return logger.init(function() {
      logger.on(function() {
          console.debug(...cont);
      });
    }, null, {showLogs: yconsole.showLogs});
  },
  error: (...cont) => {
    return logger.init(function() {
      logger.on(function() {
          console.error(...cont);
      });
    }, null, {showLogs: yconsole.showLogs});
  },
  warn: (...cont) => {
    return logger.init(function() {
      logger.on(function() {
          console.warn(...cont);
      });
    }, null, {showLogs: yconsole.showLogs});
  },
}

/**
 * Request FullScreen mode
 *
 */
export function requestFullscreen() {
  var elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen()
  }
}

export let logger = {
  /**
   * Is set with true or false after logger.init() invocation.
   */
  isIndexedDBSupported: null,
  showLogs: true,

  //// private variables
  databaseName: `${prefix}_ycoreLogger`,
  database: null,
  /**
   * Initializes window.indexedDB and logger.isIndexedDBSupported.
   * @param callbackSuccess invokes if browser supports IndexedDB.
   * @param callbackFail (optional) invokes if browser does not supports IndexedDB.
   */
  init: function(callbackSuccess, callbackFail, options) {
      let indexedDB = window.indexedDB
      let IDBTransaction = window.IDBTransaction
      let IDBKeyRange = window.IDBKeyRange

      // Check for options props
      if (options) {
        options.showLogs? logger.showLogs = options.showLogs : false
      }
      if (!indexedDB) {
          if(callbackFail) {callbackFail();}
      }
      else {
          if(!callbackSuccess) {
              throw "IllegalAgrumentException. Please provide a callback for success initialization";
          }
          callbackSuccess();
      }
  },
  /**
   * Turns on catching all console.* methods invocations and saving logs into IndexedDB
   * @param callback (optional) is invoked then database is successfully opened and console is replaced with logger.log2both.
   */
  on: function(callback) {
      if( logger.consoles.originalIsOn === false ) {
          logger.consoles.originalIsOn = true;
          if( logger.database != null ) {
              logger.replaceConsoleThenOn(callback);
          }
          else {
              logger.openDb(logger.databaseName, function() {
                  logger.replaceConsoleThenOn(callback);
              });
          }
      }
  },
  off: function() {
      if( logger.consoles.originalIsOn === true ) {
          console = logger.consoles.original;
          logger.consoles.originalIsOn = false;
      }
  },
  isOn: function() {
      return logger.consoles.originalIsOn;
  },
  clear: function() {
      if(logger.database == null) {
          throw "IllegalStateException: need to logger.init() and logger.on before clearing the database, e.g. logger.init(function(){logger.on(function(){logger.clear();});});";
      }
      logger.consoles.original.log("logger.clear");
      var objectStore = logger.database.transaction("logs").objectStore("logs");

      objectStore.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
              // cursor.key + "=" + cursor.value
              var request = logger.database.transaction(["logs"], "readwrite").objectStore("logs").delete(cursor.key);
              request.onsuccess = function(event) {
                  // It's gone!
              };
              cursor.continue();
          }
          else {
              logger.consoles.original.log("logs2indexeddb successfully cleared");
          }
      };
  },
  /**
   * Opens a file with logs.
   * If parameters are null (not specified) then method downloads all logs from database.
   * If parameters are specified, then the method filters logs and provide only records
   * that were created since fromDate to toDate.
   * @param fromDate (optional)
   * @param toDate (optional)
   */
  download: function(fromDate, toDate) {
      var fromTime = null;
      var toTime = null;
      if(fromDate != null) {
          if(toDate != null) {
              if(typeof(fromDate.getTime) === "undefined" || typeof(toDate.getTime) === "undefined" ) {
                  throw "IllegalArgumentException: parameters must be Date objects";
              }
              fromTime = fromDate.getTime();
              toTime = toDate.getTime();
          }
          else {
              throw "IllegalArgumentException: Please provide either both parameters or none of them";
          }
      }
      var objectStore = logger.database.transaction("logs").objectStore("logs");

      var data = '';
      objectStore.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
              var v = cursor.value;
              if( fromTime == null || fromTime <= v.time && v.time <= toTime) {
                  data += new Date(v.time*1)+" "+ v.label+" "+ v.log+"\n";
              }
              cursor.continue();
          }
          else {
              logger.downloadFile(data);
          }
      };
  },
  downloadToday: function() {
      var start = new Date();
      start.setHours(0,0,0,0);

      var end = new Date();
      end.setHours(23,59,59,999);
      logger.download(start, end);
  },
  /**
   * @private
   */
  downloadFile: function(data){
      if(!data) {
          logger.consoles.original.log("logger.download: Empty database");
          return;
      }
      var filename = 'console.log'

      var blob = new Blob([data], {type: 'text/plain'}),
          e    = document.createEvent('MouseEvents'),
          a    = document.createElement('a')

      a.download = filename
      a.href = window.URL.createObjectURL(blob)
      a.dataset.downloadurl =  ['text/plain', a.download, a.href].join(':')
      e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      a.dispatchEvent(e)
  },
  clearAndDrop: function() {
      logger.clear();
      // todo replace with database drop
  },
  consoles: {
      originalIsOn: false,
      /**
       * @private Logs into both - console and indexeddb
       */
      both: {
          log: function(str) {
              logger.showLogs ? logger.consoles.original.log(str) : null
              logger.consoles.indexeddb.log(str);
          },
          warn: function(str) {
              logger.showLogs ? logger.consoles.original.warn(str) : null
              logger.consoles.indexeddb.warn(str);
          },
          trace: function(str) {
              logger.showLogs ? logger.consoles.original.trace(str) : null
              logger.consoles.indexeddb.trace(str);
          },
          error: function(str) {
              logger.showLogs ? logger.consoles.original.error(str) : null
              logger.consoles.indexeddb.error(str);
          },
          info: function(str) {
              logger.showLogs ? logger.consoles.original.info(str) : null
              logger.consoles.indexeddb.info(str);
          },
          debug: function(str) {
              logger.showLogs ? logger.consoles.original.debug(str) : null
              logger.consoles.indexeddb.debug(str);
          }
      },
      /**
       * @private Original console logger. No matter if logger is on or off. Is used for internal logger logging during test.
       */
      original: console,
      /**
       * @public Logger that saves data into opened IndexedDB.
       */
      indexeddb: {
          log: function(str) {
              logger.consoles.indexeddb.write2db('log', str);
          },
          warn: function(str) {
              logger.consoles.indexeddb.write2db('warn', str);
          },
          trace: function(str) {
              logger.consoles.indexeddb.write2db('trace', str);
          },
          error: function(str) {
              logger.consoles.indexeddb.write2db('error', str);
          },
          info: function(str) {
              logger.consoles.indexeddb.write2db('info', str);
          },
          debug: function(str) {
              logger.consoles.indexeddb.write2db('debug', str);
          },
          write2db: function(label, str) {
              var time = new Date();
              time.setMonth(time.getMonth()-1);
              var data = {
                  time: time.getTime()+'',
                  label: label,
                  log: str
              };
              logger.database.transaction(["logs"], "readwrite").objectStore("logs").add(data);
          }
      }
  },
  exceptions: {
      uncatchable: {
          on: function() {
              if( logger.isOn() ) {
                  window.onerror = logger.exceptions.uncatchable.onerror.both;
              }
              else {
                  logger.consoles.original.warn("logger needs to be on to start catch uncatchable exceptions");
              }
          },
          off: function() {
              window.onerror = logger.exceptions.uncatchable.onerror.original;
          },
          onerror: {
              original: window.onerror,
              /**
               * Logs exception into the database
               */
              custom: function (errorMsg, url, lineNumber) {
                  logger.consoles.indexeddb.error(errorMsg+" "+url+" line:"+lineNumber);
                  return false;
              },
              both: function (errorMsg, url, lineNumber) {
                  logger.exceptions.uncatchable.onerror.custom("UNCATCHABLE: ----------------"+errorMsg, url, lineNumber);
                  if( logger.exceptions.uncatchable.onerror.original ) {
                      logger.exceptions.uncatchable.onerror.original(errorMsg, url, lineNumber);
                  }
              }
          }
      }
  },
  /**
   * @private Opens database and updates schema if needed.
   * @param dbName database name
   * @param callbackSuccessOpen (optional) invoked after success connect and update.
   * @param onupgradeneeded (optional) function to create different structure of the database.
   */
  openDb: function(dbName, callbackSuccessOpen, onupgradeneeded) {
      logger.consoles.original.log("openDb ...");
      // Let us open our database
      var request = indexedDB.open(dbName, 2);
      request.onerror = function (event) {
          alert("Why didn't you allow my web app to use IndexedDB?!");
          logger.consoles.original.error("openDb:", event.target.errorCode);
      };
      request.onsuccess = function (e) {
          logger.database = request.result;
          logger.consoles.original.log("openDb DONE");
          logger.database.onerror = function (event) {
              // Generic error handler for all errors targeted at this database's
              // requests!
              logger.consoles.original.error("Database error: " + event.target.errorCode);
          };
          if(callbackSuccessOpen) {callbackSuccessOpen();}
      };
      // This event is only implemented in recent browsers
      request.onupgradeneeded = function (event) {
          logger.consoles.original.log("openDb.onupgradeneeded");
          var db = event.target.result;

          var objectStore = db.createObjectStore("logs", { autoIncrement : true });

          // Create an index to search by time
          objectStore.createIndex("time", "time", { unique: false });
          objectStore.createIndex("label", "label", { unique: false });

          objectStore.transaction.oncomplete = function (event) {
              logger.consoles.original.log("openDb.onupgradeneeded.transaction.oncomplete");
          }
      };
  },
  /**
   * @private
   */
  replaceConsoleThenOn: function(callback) {
      console = logger.consoles.both;
      logger.exceptions.uncatchable.on();
      if( callback ) callback();
  },
  /**
   * Performance test methods.
   * Use
   *      $(function () {                 // This is JQuery construction that needed to be sure that html document is loaded
              logger.init(function() {// successfully initialized
                  logger.debug.startIndexedDBTest(5000, 'status');
              }, function() {// error
                  window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
                  logger.debug.status.html("<span style='color: red;>Error: Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.</span>");
              });
          });
   *      <p id="status"></p>
   * to test 5000 writes.
   */
  debug: {
      statusElementId: null,
      startTime: null,
      totalNumberOfWrites: null,

      /**
       * Opens database and starts WriteTest
       * @param n number of records to write during the test.
       * @param statusElementId html element's id to write results of the test.
       */
      startIndexedDBTest: function(n, statusElementId) {
          if( !n || !statusElementId ) {
              throw "IllegalArgumentsException";
          }
          logger.debug.statusElementId = statusElementId;
          logger.debug.status('Testing...');

          logger.openDb("logs2indexeddb_test", function() {
              logger.debug.processWriteTest(logger.database, n);
          }, logger.debug.onupgradeneeded);
      },
      onupgradeneeded:  function (event) {
          logger.consoles.original.log("debug.onupgradeneeded");
          var db = event.target.result;

          // Create an objectStore to hold information about our customers. We're
          // going to use "ssn" as our key path because it's guaranteed to be
          // unique.
          var objectStore = db.createObjectStore("customers", { keyPath: "ssn" });

          // Create an index to search customers by name. We may have duplicates
          // so we can't use a unique index.
          objectStore.createIndex("name", "name", { unique: false });

          // Create an index to search customers by email. We want to ensure that
          // no two customers have the same email, so use a unique index.
          objectStore.createIndex("email", "email", { unique: true });

          // Use transaction oncomplete to make sure the objectStore creation is
          // finished
          objectStore.transaction.oncomplete = function (event) {
              logger.consoles.original.log("debug.onupgradeneeded.transaction.oncomplete");
          }
      },
      /**
       * @private
       */
      processWriteTest: function(db, n) {
          logger.consoles.original.log("processWriteTest");

          logger.debug.status('Connected to database. Preparing to process ' + n + " writes.");
          alert("The test can take a lot of time (1-2 minutes). The browser can be locked duting the test. Ready to launch?");
          logger.debug.status("Testing... Please wait until test will be finished.");

          logger.debug.totalNumberOfWrites = n;
          logger.debug.startTime = new Date();
          for (var i = 0; i < n; i++) {
              //                    status("Writing "+i+" record...");                          // Comment this to get real time estimate
              logger.debug.processWrite(db, i);
          }
          // The write will be finished after last callback
      },
      /**
       * @private
       */
      testFinished: function () {
          logger.consoles.original.log("testFinished");
          var n = logger.debug.totalNumberOfWrites;
          var end = new Date();
          var diff = end.getMinutes() * 60 + end.getSeconds() - (logger.debug.startTime.getMinutes() * 60 + logger.debug.startTime.getSeconds());
          var mean = diff / n;

          alert("Done. Check the result on the page.");
          logger.debug.status("One write request takes <b>" + mean + "</b> seconds.<br>Test time: " + diff + " seconds");
      },
      /**
       * @private
       */
      processWrite: function (db, i) {
          //                logger.consoles.original.log("processWrite");
          var transaction = db.transaction(["customers"], "readwrite");

          // Do something when all the data is added to the database.
          transaction.oncomplete = function (event) {
              //                    logger.consoles.original.log("processWrite.transaction.oncomplete");
          };

          transaction.onerror = function (event) {
              // Don't forget to handle errors!
              //                    logger.consoles.original.error("processWrite.transaction.onerror: "+event.code);
          };

          var objectStore = transaction.objectStore("customers");

          var data = { ssn: i, name: "Bill", age: 35, email: "mail" + i + "@rtlservice.com" }
          var request = objectStore.put(data);
          request.onsuccess = function (event) {
              // event.target.result == customerData[i].ssn;
              //                    logger.consoles.original.log("processWrite.transaction...onsuccess: "+event.target.result);
              if (i == logger.debug.totalNumberOfWrites - 1) {
                  logger.debug.testFinished();
              }
          };
          request.onerror = function () {
              logger.consoles.original.error("addPublication error", this.error);
          }
      },
      status: function (str) {
          document.getElementById(logger.debug.statusElementId).innerHTML = str;
      }
  }
}