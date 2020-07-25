import React from 'react'
import styles from './index.less'
import { app_info, UUAID, package_json } from 'core'
import * as antd from 'antd'

const { logo, name, version, stage } = app_info

export default class App_About extends React.Component {
  DetectNoNStableBuild() {
    if (package_json.DevBuild == false) {
      return <antd.Tag color="blue">Stable</antd.Tag>
    } else {
      return <antd.Tag color="orange">No Stable</antd.Tag>
    }
  }
  render() {
    return (
      <div className={styles.aboutWrapper}>
        <img src={logo} />
        <antd.Card>
          <h1 className={styles.appName}> {name} </h1>
          {UUAID}
          <br />
          <antd.Tag color="geekblue">v{version}</antd.Tag>
          <antd.Tag color="red">{stage}</antd.Tag>
          {this.DetectNoNStableBuild()}
        </antd.Card>
      </div>
    )
  }
}
