import React from 'react'
import styles from './index.less'
import { clientInfo, GUID, package_json } from 'core'
import { Monitor, Package, Radio, Layers } from 'components/Icons'
import * as antd from 'antd'

export default class App_About extends React.Component {
  renderStableTag() {
    return <antd.Tag color={clientInfo.buildStable? "blue" : "orange"}>{clientInfo.buildStable? "Stable" : "Not Stable"}</antd.Tag>
  }
  render() {
    return (
      <div className={styles.aboutWrapper}>
        <img src={clientInfo.logo} />
        <antd.Card>
          <h1 className={styles.appName}> {clientInfo.siteName} </h1>
          {GUID}
          <br />
          <antd.Tag color="green"><Monitor />{clientInfo.os.toString()}</antd.Tag>
          <antd.Tag color="geekblue"><Package />v{clientInfo.version}</antd.Tag>
          <antd.Tag color="red"><Radio />{clientInfo.packageStage}</antd.Tag>
          <antd.Tag color="magenta"><Layers />Render with {clientInfo.layout}</antd.Tag>
          {this.renderStableTag()}

        </antd.Card>
      </div>
    )
  }
}
