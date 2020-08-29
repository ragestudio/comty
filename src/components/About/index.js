import React from 'react'
import styles from './index.less'
import { app_info, UUAID, package_json } from 'core'
import * as Icons from 'components/Icons'
import * as antd from 'antd'

const { logo, name, version, stage, os, layout } = app_info

export default class App_About extends React.Component {
  renderStableTag() {
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
          <antd.Tag color="green"><Icons.Monitor />{os.toString()}</antd.Tag>
          <antd.Tag color="geekblue"><Icons.Package />v{version}</antd.Tag>
          <antd.Tag color="red"><Icons.Radio />{stage}</antd.Tag>
          <antd.Tag color="magenta"><Icons.Layers />Render with {layout}</antd.Tag>
          {this.renderStableTag()}
         

        </antd.Card>
      </div>
    )
  }
}
