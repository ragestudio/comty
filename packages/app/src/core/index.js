import { cloneDeep } from 'lodash'
import store from 'store'
import { pathToRegexp } from 'path-to-regexp'
import config from 'config'

const languages = config.i18n ? config.i18n.languages.map(item => item.key) : []
const defaultLanguage = config.i18n ? config.i18n.defaultLanguage : 'en'

/**
 * Query objects that specify keys and values in an array where all values are objects.
 * @param   {array}         array   An array where all values are objects, like [{key:1},{key:2}].
 * @param   {string}        key     The key of the object that needs to be queried.
 * @param   {string}        value   The value of the object that needs to be queried.
 * @return  {object|undefined}   Return frist object when query success.
 */
export function queryArray(array, key, value) {
    if (!Array.isArray(array)) {
        return
    }
    return array.find(_ => _[key] === value)
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
    const result = []
    const hash = {}
    const data = cloneDeep(array)

    data.forEach((item, index) => {
        hash[data[index][id]] = data[index];
    })

    data.forEach(item => {
        const hashParent = hash[item[parentId]]
        if (hashParent) {
            !hashParent[children] && (hashParent[children] = [])
            hashParent[children].push(item)
        } else {
            result.push(item)
        }
    })
    return result
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
    const result = [current]
    const hashMap = new Map()
    array.forEach(item => hashMap.set(item[id], item))

    const getPath = current => {
        const currentParentId = hashMap.get(current)[parentId]
        if (currentParentId) {
            result.push(currentParentId)
            getPath(currentParentId)
        }
    }

    getPath(current)
    return result
}

/**
 * Query which layout should be used for the current path based on the configuration.
 * @param   {layouts}     layouts   Layout configuration.
 * @param   {pathname}    pathname  Path name to be queried.
 * @return  {string}   Return frist object when query success.
 */
export function queryLayout(layouts, pathname) {
    let result = 'public'

    const isMatch = regepx => {
        return regepx instanceof RegExp
            ? regepx.test(pathname)
            : pathToRegexp(regepx).exec(pathname)
    }

    for (const item of layouts) {
        let include = false
        let exclude = false
        if (item.include) {
            for (const regepx of item.include) {
                if (isMatch(regepx)) {
                    include = true
                    break
                }
            }
        }

        if (include && item.exclude) {
            for (const regepx of item.exclude) {
                if (isMatch(regepx)) {
                    exclude = true
                    break
                }
            }
        }

        if (include && !exclude) {
            result = item.name
            break
        }
    }

    return result
}

export function getLocale() {
    return store.get('locale') || defaultLanguage
}

export function setLocale(language) {
    if (getLocale() !== language) {
        store.set('locale', language)
        window.location.reload()
    }
}

export function queryIndexer(array, callback, params) {
    if (!array) return false
    if (typeof (pathMatchRegexp) == "undefined") {
        return false
    }

    if (Array.isArray(array)) {
        let opt = {
            regex: /:id/gi
        }

        if (params) {
            opt = { ...opt, ...params }
        }

        array.forEach((e) => {
            if (e.match != null && e.to != null) {
                const pathMatch = pathMatchRegexp(e.match, window.location.pathname)
                if (pathMatch != null) {
                    return callback(e.to.replace(opt.regex, pathMatch[1]))
                }
            }
        })
    }
}

export function generateGUID(lenght = 6) {
    let text = ""
    const possibleChars = "abcdefghijklmnopqrstuvwxyz0123456789"

    for (let i = 0; i < 6; i++)
        text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length))

    return text
}

export function generateRandomId(length = 15) {
    return Math.random().toString(36).substring(0, length)
}

//
export function geteventBus() {
    if (typeof window.app.eventBus !== "undefined") {
        return window.app.eventBus
    }
    return null
}

export { config, languages, defaultLanguage }