import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import errNumbers from 'config/handlers/numToError.js'
import { Meh } from 'components/Icons'

const InvalidSkeleton = (props) => {
    return(
        <antd.Card className={styles.invalidSkeleton} bordered="false">
            <antd.Skeleton active />
            <antd.Result style={{ 
                position: "absolute", 
                zIndex: "15", 
                width: "100%", 
                height: "100%", 
                padding: "12px 24px"
            }}>
                Sorry but, something did not work as it should...
            </antd.Result>
        </antd.Card>
    )
}

const InvalidSession = (props) => {
    return(
        <div className={styles.floatCardWrapper} bordered="false">
            <antd.Result status="403" title="You need to login for view this!" />
        </div>
    )
}

const InvalidIndex = (props) => {
    return(
        <div className={styles.floatCardWrapper} bordered="false">
            <antd.Result>
                Sorry but, We could not index this <antd.Tag style={{ marginLeft: "12px", lineHeight: "24px"}}>{props.messageProp1}</antd.Tag>
            </antd.Result>
        </div>
    )
}

const Custom = (props) => {
    return(
        <div className={styles.floatCardWrapper} style={props.style ?? null} >
            <antd.Result icon={props.icon ?? null} status={props.status ?? "info"} title={props.title ?? ""}>
                {props.message}
            </antd.Result>
        </div>
    )
}

export default class Invalid extends React.Component{
    render(){
        const Components = {
            SESSION_INVALID: <InvalidSession />,
            INVALID_INDEX: <InvalidIndex {...this.props} />,
            skeleton: <InvalidSkeleton {...this.props} />,
            custom: <Custom {...this.props} />
        }
        const { type, typeByCode } = this.props
        if (type != null || typeByCode != null) {
            let tmpType = null

            type? tmpType = type : null
            typeByCode? tmpType = errNumbers[typeByCode] : null

            if (Components[tmpType] != null) {
                return Components[tmpType]
            }

        }
        return <Custom
            icon={<Meh style={{ fontSize: "100px" }} />} 
            title="A function called this component due to an error, but apparently it also caused an error when configuring these parameters."
            message="it seems that someone is not having a good day"
        />
    }
}