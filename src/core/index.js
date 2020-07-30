import moment from 'moment';
import { format } from 'timeago.js';
import { cloneDeep } from 'lodash';
import store from 'store';
import { i18n, app_config } from 'config';

const { pathToRegexp } = require('path-to-regexp');

export const languages = i18n ? i18n.languages.map(item => item.key) : [];
export const defaultLanguage = i18n ? i18n.defaultLanguage : '';

import './libs'
import './cores'

export const package_json = require('../../package.json');
export const UUAID = `${package_json.name}==${package_json.UUID}`;

export const app_info = {
  appid: package_json.name,
  stage: package_json.stage,
  name: package_json.title,
  version: package_json.version,
  logo: app_config.FullLogoPath,
  logo_dark: app_config.DarkFullLogoPath,
};

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
 * Remove an element by id from an array
 *
 * @param array {array}
 * @param value {string}
 * @return object
 */
export function arrayRemoveByID(arr, value) {
  return arr.filter(function(ele) {
    return ele.id != value;
  });
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
    return ele.key != value;
  });
}

/**
 * Global fix for convert '1, 0' to string boolean 'true, false'
 *
 * @param e {int} Numeric boolean reference
 * @return {bool} Boolean value
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
};

export function pathMatchRegexp(regexp, pathname) {
  return pathToRegexp(regexp).exec(deLangPrefix(pathname));
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
 * In an array of objects, specify an object that traverses the objects whose parent ID matches.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    current   Specify the object that needs to be queried.
 * @param   {string}    parentId  The alias of the parent ID of the object in the array.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @return  {array}    Return a key array.
 */
export function queryAncestors(array, current, parentId, id = 'id') {
  const result = [current];
  const hashMap = new Map();
  array.forEach(item => hashMap.set(item[id], item));

  const getPath = current => {
    const currentParentId = hashMap.get(current[id])[parentId];
    if (currentParentId) {
      result.push(hashMap.get(currentParentId));
      getPath(hashMap.get(currentParentId));
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
