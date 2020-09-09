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


export default class Invalid extends React.Component{
    constructor(props){
        super(props)
    }

    render(){
        const Components = {
            skeleton: <InvalidSkeleton />
        }
        const type = this.props.type
        if (!type) {
            return null
        }
        return Components[type]
    }
}