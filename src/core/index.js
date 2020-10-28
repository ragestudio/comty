import moment from 'moment';
import { format } from 'timeago.js';
import { cloneDeep } from 'lodash';
import store from 'store';
import { i18n, app_config } from 'config';
import handle from 'core/libs/errorhandler'
import request from 'request'
import html2canvas from 'html2canvas'
import platform from 'platform'
import path from 'path'
import fs from 'fs'
import * as utils from '@ragestudio/nodecore-utils'

const { pathToRegexp } = require('path-to-regexp');

export const languages = i18n ? i18n.languages.map(item => item.key) : [];
export const defaultLanguage = i18n ? i18n.defaultLanguage : '';

import * as libs from './libs'

export * from '@ragestudio/nodecore-utils'
export const package_json = require('../../package.json');
export const GUID = app_config.guid;

export const clientInfo = {
  buildStable: getBuild()["stable"],
  packageName: package_json.name,
  packageStage: package_json.stage,
  siteName: app_config.siteName,
  version: package_json.version,
  logo: app_config.FullLogoPath,
  logo_dark: app_config.DarkFullLogoPath,
  os: platform.os,
  layout: platform.layout
};

export function getBuild() {
  let build = {
    stable: false
  }
  try {
    if (!window.__build) {
      return false
    }
    const buildPath = path.resolve(__dirname, "./dist")
    const data = JSON.parse(fs.readFileSync(`${buildPath}/build.json`))
    if (typeof(data) !== "undefined" && Array.isArray(data)) {
      utils.__legacy____legacy__objectToArray(data).forEach((e) => {
        build[e.key] = e.value
      })
    }
  } catch (error) {
    // tf this is not a build sorry
  }
  return build
}

export function queryIndexer(array, callback, params) {
    if(!array) return false
    
    if (Array.isArray(array)) {
      let opt = {
        regex: /:id/gi
      }

      if (params) {
        opt = { ...opt, ...params }
      }

      array.forEach((e) =>{
        if (e.match != null && e.to != null) {
          const pathMatch = pathMatchRegexp(e.match, window.location.pathname)
          if (pathMatch != null) {
            return callback(e.to.replace(opt.regex, pathMatch[1]))
          }
        }
      })
    }
}

export function createScreenshotFromElement(element){
  if (!element) return false
  html2canvas(element, {
    useCORS: true,
    proxy: "localhost:8000",
    scale: 4,
    backgroundColor: "transparent"
  }).then(canvas => {
    downloadEncodedURI({ data: canvas.toDataURL() })
  })
}

export function generatePostURI(id){
  if(window.location.origin && id){
    return `${window.location.origin}/post/${id}`
  }
  return null
}

export function writeToClipboard(text){
  navigator.clipboard.writeText(text)
  .then(() => {
    libs.appInterface.notify.info('Copy to clipboard')
  }, () => {
    /* failure */
  })
}

// [Experimental], not in use
export function getGlobals(params, callback) {
  if (!params || !params.server) return false
  let tmpResponse = []

  let req = {
    global: "__globals",
    url: params.server
  }

  params.global? req.global = params.global : null

  let urlString = `${req.url}/${req.global}.json`
  console.log(urlString)
  
  request(urlString, (error, response, body) => {
    tmpResponse = body
    callback(tmpResponse)
  })
}

export function isOs(os){
  if(process){
    return process.platform === os? true : false
  }else{
    return false
  }
}

export function imageToBase64(img, callback){
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result))
  reader.readAsDataURL(img)
}

export function urlToBase64(url, callback){
  let xhr = new XMLHttpRequest();
  xhr.onload = function() {
      let reader = new FileReader();
      reader.onloadend = function() {
          callback(reader.result);
      }
      reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.responseType = 'blob';
  xhr.send();
}

export function b64toBlob(b64Data, contentType='', sliceSize=512){
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

/**
 * Generate a download with encoded uri
 * 
 * @param {object} payload - Generation Data
 */
export function downloadDecodedURI(payload){
  if(!payload) return false
  let { data, type, charset, filename } = payload
  /**
    * 
    * @param {object} payload - Generation Data
    */
  if (!data || !type) return false
  try {
    if (!filename) {
      filename = `${app_config.id}_${time.now()}.${type.split("/")[1]}`
    }
    let tmp = document.createElement('a')
    tmp.href = `data:${type};charset=${charset},${encodeURIComponent(data)}`
    tmp.download= filename
    tmp.click()
  } catch (error) {
      handle({ msg: error, code: 120 })
  }
}

export function downloadEncodedURI(payload){
  if(!payload) return false
  let { data, filename } = payload
  /**
    * 
    * @param {object} payload - Generation Data
    */
  if (!data) return false
  try {
    if (!filename) {
      filename = `${app_config.id}_${time.now()}.${data.split("/")[1].split(";")[0]}`
    }
    let tmp = document.createElement('a')
    tmp.href = data
    tmp.download= filename
    tmp.click()
  } catch (error) {
      handle({ msg: error, code: 120 })
  }
}

export function GetPropertyValue(object, dataToRetrieve) {
  dataToRetrieve.split('.').forEach(function(token) {
    if (object) object = object[token];
  })
  return object;
}

/**
 * Return the last object from array
 *
 * @param array {array}
 * @return object
 */
export function objectLast(array, n) {
  if (array == null) return void 0;
  if (n == null) return array[array.length - 1];
  return array.slice(Math.max(array.length - n, 0));
}

/**
 * Object to array scheme RSA-YCORE-ARRAYPROTO.2
 *
 * @param object {object}
 * @return array
 */
export function arrayToObject(array) {
  if(!array) return false
  let tmp = []
  
  array.forEach((e) => {
    tmp[e.key] = e.value
  })

  return tmp
}

/**
 * Remove an element by id from an object array
 *
 * @param object {object}
 * @param id {string}
 * @return array
 */
export function objectRemoveId(object, id) {
  let arr = __legacy__objectToArray(object)
  return arr.filter((e) => {
    return e.id != id;
  });
}
/**
 * Remove an element by key from an object array
 *
 * @param object {object}
 * @param key {string}
 * @return array
 */
export function objectRemoveKey(object, key) {
  let arr = __legacy__objectToArray(object)
  return arr.filter((e) => {
    return e.key != key;
  });
}


/**
 * Global fix for convert '1, 0' to string boolean 'true, false'
 *
 * @param e {int} Numeric boolean reference
 * @return bool
 */
export function booleanFix(e) {
  if (e == 1) return true;
  return false;
}

/**
 * Request FullScreen mode
 *
 */
export function requestFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

/**
 * Handle time basic functions
 *
 */
export const time = {
  ago: a => {
    const format = moment(a).format('DDMMYYYY');
    const b = new Date(format).toLocaleString();
    return time.relativeToNow(b);
  },
  stmToAgo: a => {
    const b = a * 1000;
    return format(b);
  },
  relativeToNow: (a, b) => {
    return moment(a, b || 'DDMMYYYY').fromNow();
  },
  now: () => {
    return new Date().toLocaleString();
  }
};

export function pathMatchRegexp(regexp, pathname) {
  return pathToRegexp(regexp).exec(pathname)
}

/**
 * Query objects that specify keys and values in an array where all values are objects.
 * @param   {array}         array   An array where all values are objects, like [{key:1},{key:2}].
 * @param   {string}        key     The key of the object that needs to be queried.
 * @param   {string}        value   The value of the object that needs to be queried.
 * @return  {object|undefined}   Return frist object when query success.
 */
export function queryArray(array, key, value) {
  if (!Array.isArray(array)) {
    return;
  }
  return array.find(_ => _[key] === value);
}

/**
 * Convert an array to a tree-structured array.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @param   {string}    parentId       The alias of the parent ID of the object in the array.
 * @param   {string}    children  The alias of children of the object in the array.
 * @return  {array}    Return a tree-structured array.
 */
export function arrayToTree(
  array,
  id = 'id',
  parentId = 'pid',
  children = 'children',
) {
  const result = [];
  const hash = {};
  const data = cloneDeep(array);

  data.forEach((item, index) => {
    hash[data[index][id]] = data[index];
  });

  data.forEach(item => {
    const hashParent = hash[item[parentId]];
    if (hashParent) {
      !hashParent[children] && (hashParent[children] = []);
      hashParent[children].push(item);
    } else {
      result.push(item);
    }
  });
  return result;
}

/**
 * In an array object, traverse all parent IDs based on the value of an object.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    current   Specify the value of the object that needs to be queried.
 * @param   {string}    parentId  The alias of the parent ID of the object in the array.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @return  {array}    Return a key array.
 */
export function queryPathKeys(array, current, parentId, id = 'id') {
  const result = [current];
  const hashMap = new Map();
  array.forEach(item => hashMap.set(item[id], item));

  const getPath = current => {
    const currentParentId = hashMap.get(current)[parentId];
    if (currentParentId) {
      result.push(currentParentId);
      getPath(currentParentId);
    }
  };

  getPath(current);
  return result;
}

/**
 * Query which layout should be used for the current path based on the configuration.
 * @param   {layouts}     layouts   Layout configuration.
 * @param   {pathname}    pathname  Path name to be queried.
 * @return  {string}   Return frist object when query success.
 */
export function queryLayout(layouts, pathname) {
  let result = 'public';

  const isMatch = regepx => {
    return regepx instanceof RegExp
      ? regepx.test(pathname)
      : pathToRegexp(regepx).exec(pathname);
  };

  for (const item of layouts) {
    let include = false;
    let exclude = false;
    if (item.include) {
      for (const regepx of item.include) {
        if (isMatch(regepx)) {
          include = true;
          break;
        }
      }
    }

    if (include && item.exclude) {
      for (const regepx of item.exclude) {
        if (isMatch(regepx)) {
          exclude = true;
          break;
        }
      }
    }

    if (include && !exclude) {
      result = item.name;
      break;
    }
  }

  return result;
}

export function getLocale() {
  return store.get('locale') || defaultLanguage;
}

export function setLocale(language) {
  if (getLocale() !== language) {
    store.set('locale', language);
    window.location.reload();
  }
}

export function get_value(source,key){
  if( !key || !source ) return false
    try {
        const find = source.find(item => {
          return item.id === key
        })
        return find.value
      
    } 
    catch (error) {
        return false
    }
}

export function iatToString(iat){
  return  new Date(iat * 1000).toLocaleString()
}

export function generateGUID( lenght = 6 ){
  let text = ""
  const possibleChars = "abcdefghijklmnopqrstuvwxyz0123456789"

  for ( let i = 0; i < 6; i++ )
    text += possibleChars.charAt ( Math.floor ( Math.random () * possibleChars.length ) )

  return text
}

export function generateRandomId( length = 15 ){
	return Math.random ().toString ( 36 ).substring ( 0, length );
}