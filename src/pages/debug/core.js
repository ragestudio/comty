import React from 'react'
import * as antd from 'antd'
import * as core from 'core'

export default class CoreDebug extends React.Component {
    render(){
        const handleGenerateUUID = () => { console.log(core.generateUUID()) }
        return(
            <div>
                <antd.Button onClick={() => handleGenerateUUID()} >generate uuid</antd.Button>
            </div>
        )
    }
}