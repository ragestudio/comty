import React from 'react'
import styles from './index.less'
import * as app from 'app'
import * as antd from 'antd'

export default class App_About extends React.Component {
  DetectNoNStableBuild() {
    if (app.package_json.DevBuild == false) {
      return <antd.Tag color="blue">Stable</antd.Tag>
    } else {
      return <antd.Tag color="orange">No Stable</antd.Tag>
    }
  }
  render() {
    return (
      <div className={styles.aboutWrapper}>
        <img src={app.AppInfo.logo} />
        <antd.Card>
          <h1 className={styles.appName}> {app.AppInfo.name} </h1>
          {app.UUAID}
          <br />
          <antd.Tag color="geekblue">v{app.AppInfo.version}</antd.Tag>
          <antd.Tag color="red">{app.AppInfo.stage}</antd.Tag>
          {this.DetectNoNStableBuild()}
        </antd.Card>
      </div>
    )
  }
}
