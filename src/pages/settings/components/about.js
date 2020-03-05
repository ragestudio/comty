import React from 'react'
import styles from './about.less'
import * as ycore from 'ycore'
import * as antd from 'antd'


class AppAbout extends React.Component {
    render(){
        return(
            <div className={styles.aboutWrapper}>
                <img src={ycore.AppInfo.logo} />
                <antd.Card >
                    <h1 className={styles.appName}> {ycore.AppInfo.name} </h1>
                    <antd.Tag color="geekblue">v{ycore.AppInfo.version}</antd.Tag>{ycore.DetectNoNStableBuild('TagComponent')}
                </antd.Card>
            </div>
        )
    }
}
export default AppAbout