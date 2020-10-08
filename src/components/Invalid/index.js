import React from 'react'
import * as antd from 'antd'
import styles from './index.less'

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
                Bruh fail?
            </antd.Result>
        </antd.Card>
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
            <antd.Result status={props.status ?? "info"} title={props.title ?? ""}>
                {props.message}
            </antd.Result>
        </div>
    )
}

export default class Invalid extends React.Component{
    render(){
        const Components = {
            skeleton: <InvalidSkeleton {...this.props} />,
            index: <InvalidIndex {...this.props} />,
            custom: <Custom {...this.props} />
        }
        const type = this.props.type
        if (!type) {
            return null
        }
        return Components[type]
    }
}