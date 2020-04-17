/**
 *    @yCore_Worker
 *
 * @author rStudio© 2020
 * @license Pending...
 */

import * as Endpoints from 'globals/endpoints/index.js'
import io from 'socket.io-client'
import * as Icons from '@ant-design/icons'
import localforage from 'localforage'
import { format } from 'timeago.js'
import * as antd from 'antd'
import moment from 'moment'
import React from 'react'

import config from 'config'
import './libs.js'

export * from '../../config/app.settings.js'
export * from './libs.js'
export * from 'utils'

export var endpoints = Endpoints

export const package_json = require('../../package.json')

export const UUAID = `${package_json.name}==${package_json.UUID}`

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
 * Framework functionality for show with interface an notification
 *
 */
const {FieldTimeOutlined} = require('@ant-design/icons')
export const notify = {
  expire: (...res) => {
    antd.notification.error({
      message: 'Hey ',
      icon: <FieldTimeOutlined />,
      description: res,
      placement: 'bottomLeft',
    })
  },
  info: (...res) => {
    antd.notification.info({
      message: 'Well',
      description: res.toString(),
      placement: 'bottomLeft',
    })
  },
  exception: (...res) => {
    antd.notification.error({
      message: 'WoW!',
      description: res.toString(),
      placement: 'bottomLeft',
    })
  },
  warn: (...res) => {
    antd.notification.warn({
      message: 'Hey!',
      description: res.toString(),
      placement: 'bottomLeft',
    })
  },
  success: (...res) => {
    antd.notification.success({
      message: 'Well',
      description: res.toString(),
      placement: 'bottomLeft',
    })
  },
  error: (...res) => {
    antd.notification.error({
      message: 'Wopss',
      description: (
        <div>
          <span>An wild error appear! : </span>
          <br />
          <br />
          <div
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: 'rgba(243, 19, 19, 0.329)',
              bottom: '0',
              color: 'black',
              padding: '3px',
            }}
          >
            {res.toString()}
          </div>
        </div>
      ),
      placement: 'bottomLeft',
    })
  },
  proccess: (...res) => {
    antd.notification.open({
      icon: <Icons.LoadingOutlined style={{ color: '#108ee9' }} />,
      message: 'Please wait',
      description: <div>{res}</div>,
      placement: 'bottomLeft',
    })
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
