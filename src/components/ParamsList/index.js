import React from 'react';
import * as antd from 'antd'
import { RefreshCw } from 'components/Icons'
import { __legacy__objectToArray, getCircularReplacer, decycle } from 'core'

const serializeFlags = {
    __cycle_flag: true // with id 0
}

function isFlagId(e, id) {
    return serializeFlags[Object.keys(e)[id ?? 0]]
}

const getErrorRender = (e, error) => {
    return (
        <div key={e.key} >
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", height: "47px", backgroundColor: "#d9d9d9" }} key={e.key} >
                This could not be rendered > ({e.key}) [{typeof (e.value)}]
            </div>
            <div>
                <antd.Collapse>
                    <antd.Collapse.Panel header="See error" >
                        <div style={{ margin: '0 5px 15px 5px', wordBreak: "break-all" }} >
                            <span>{error.toString()}</span>
                        </div>
                    </antd.Collapse.Panel>
                </antd.Collapse>
            </div>
        </div>
    )
}

const getDecoratorStr = (e, json) => {
    try {
        switch (typeof (e.value)) {
            case "string": {
                return `(${json.length}) characters`
            }
            case "object": {
                if (e.value == null) {
                    return `Empty (null/undefined)`
                }
                if (isFlagId(e.value, 0)) {
                    return <span><RefreshCw /> Cylic </span>
                }
                if (typeof (e.value.length) !== "undefined") {
                    return `Lenght (${e.value.length})`
                }
                if (typeof (Object.keys(e.value).length) !== "undefined") {
                    return `Lenght (${Object.keys(e.value).length})`
                }
                return `Immeasurable (by error) (not valid object)`
            }
            case "array": {
                return `Lenght (${e.value.length})`
            }
            case "boolean": {
                return <antd.Tag color={e.value ? "blue" : "volcano"} > {e.value ? "true" : "false"} </antd.Tag>
            }
            case "number": {
                return <antd.Tag > {e.value} </antd.Tag>
            }
            default:
                return `Immeasurable / Invalid`
        }
    } catch (error) {
        return <strong>Immeasurable (by error)</strong>
    }
}

const getContent = (e) => {
    try {
        switch (typeof (e.value)) {
            case "string": {
                return e.value
            }
            case "object": {
                if (e.value == null) {
                    return `${e.value}`
                }
                if (isFlagId(e.value, 0)) {
                    return <div key={e.key} style={{ display: "flex", alignItems: "center", padding: "12px 16px", height: "47px", backgroundColor: "#d9d9d9" }} >
                        <RefreshCw /> This cannot be rendered because a cylic has been detected
                    </div>
                }
                if (Object.keys(e.value).length > 0) { // trying create nested
                    return <div>
                        {DebugPanel(e.value)}
                    </div>
                }
                return JSON.stringify(e.value, getCircularReplacer())
            }
            case "array": {
                return JSON.stringify(e.value, getCircularReplacer())
            }
            case "boolean": {
                return `${e.value}`
            }
            default:
                return `${e.value}`
        }
    } catch (error) {
        return getErrorRender(e, error)
    }
}

const getType = (e) => {
    if (e !== null && isFlagId(e, 0)) {
        return `[loop]`
    }
    return `[${typeof (e)}]`
}

export default function DebugPanel(data) {
    if (!data) return false
    return __legacy__objectToArray(decycle(data)).map(e => {
        try {
            const content = getContent(e)
            return (
                <antd.Collapse style={{ border: '0px' }} key={e.key}>
                    <antd.Collapse.Panel key={e.key} header={<div>{getType(e.value)} <strong>{e.key}</strong> | {getDecoratorStr(e, content)} </div>} >
                        <div style={{ margin: '0 5px 15px 5px', wordBreak: "break-all" }} >
                            <span>{content}</span>
                        </div>
                    </antd.Collapse.Panel>
                </antd.Collapse>
            )
        } catch (error) {
            return getErrorRender(e, error)
        }
    })
}