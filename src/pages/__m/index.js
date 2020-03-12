
import React from 'react';
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';
import $ from 'jquery'
import Icon from '@ant-design/icons'

import styles from './style.less'
import { GridContent } from '@ant-design/pro-layout';
import { json } from 'body-parser';

const UserData = ycore.SDCP()

export default class __m extends React.Component {
  constructor(props){
    super(props),
    this.state = {
      s_id: '',
      coninfo: 'Getting info...',
    };
  }

  componentDidMount() {
    if (ycore.__permission() == false) {
      return ycore.crouter.native('main')
    }
    this.handleSID()
  }

  handleSID(){
    ycore.get_app_session.get_id((err, response)=> {
      if (err){
        return ycore.notifyError(err)
      }
      this.setState({ s_id: response})
    })
  }
  DescompileSDCP(){
    let result = {};
    for (var i = 0; i < UserData.length; i++) {
      result[UserData[i].key] = UserData[i].value;
    }
    console.log([result])
  }

  render() {
    const arrayOfSDCP = Object.entries(UserData).map((e) => ( { [e[0]]: e[1] } ));

    return (
      <div className={styles.Wrapper}>
          <div className={styles.titleHeader}>
            <h1><Icons.DeploymentUnitOutlined /> yCore™ Server</h1>
          </div>
          <div className={styles.sectionWrapper}>
            <antd.Card>
              <h2><Icons.CloudServerOutlined /> Server UID</h2>
              <span> {ycore.yConfig.server_key} </span>
            </antd.Card>  
            <antd.Card>
              <h2><Icons.UserOutlined /> Your SID</h2>
              <span> {this.state.s_id} </span>
            </antd.Card>
            <antd.Card>
              <span> Using v{ycore.AppInfo.version} | User @{UserData.username}#{UserData.id} | </span>  
            </antd.Card>
          </div>

          <div className={styles.titleHeader}>
            <h1><Icons.DeploymentUnitOutlined /> Test yCore™</h1>
          </div>
          <div className={styles.sectionWrapper}>
            <antd.Button onClick={() => ycore.notifyError('Yep, its not empty, jeje funny')} > Send empty notifyError() </antd.Button>
            <antd.Button onClick={() => ycore.notifyError(`ycore.GetPosts(uid, get, '0', (err, result) => {
const parsed = JSON.parse(result)['data']
const isEnd = parsed.length < ycore.DevOptions.limit_post_catch? true : false
this.setState({ isEnd: isEnd, data: parsed, loading: false })
})

`)} > Send mock notifyError() </antd.Button>
          </div>

          <div className={styles.titleHeader}>
            <h1><Icons.DatabaseOutlined  /> SDCP™</h1>
          </div>
          <div className={styles.sectionWrapper}>
            <antd.Card>
              <h2><Icons.CloudServerOutlined /> UserData</h2>
              <antd.Collapse>
                <antd.Collapse.Panel  header="WARNING: High Heap when descompile data! " key="1">
                  { JSON.stringify(arrayOfSDCP) }
                </antd.Collapse.Panel>
              </antd.Collapse>

              
              
              
            
            </antd.Card>  
            
          </div>

      </div>
    )
  }
}
