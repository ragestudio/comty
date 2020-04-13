import React from 'react'
import styles from './index.less'
import * as ycore from 'ycore'
import * as antd from 'antd'

export default class App_About extends React.Component {
  DetectNoNStableBuild() {
    if (ycore.package_json.DevBuild == false) {
      return <antd.Tag color="blue">Stable</antd.Tag>
    } else {
      return <antd.Tag color="orange">No Stable</antd.Tag>
    }
  }
  render() {
    return (
      <div className={styles.aboutWrapper}>
        <img src={ycore.AppInfo.logo} />
        <antd.Card>
          <h1 className={styles.appName}> {ycore.AppInfo.name} </h1>
          {ycore.UUAID}
          <br />
          <antd.Tag color="geekblue">v{ycore.AppInfo.version}</antd.Tag>
          <antd.Tag color="red">{ycore.AppInfo.stage}</antd.Tag>
          {this.DetectNoNStableBuild()}
        </antd.Card>
      </div>
    )
  }
}
