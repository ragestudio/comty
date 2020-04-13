import React from 'react'
import * as antd from 'antd'

export default class Marketplace extends React.PureComponent{
    render(){
        return(
            <antd.Result status="404" title="Hey!" subTitle="It seems that this version of the app is not yet available this function" />
        )
    }
}