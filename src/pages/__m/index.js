
import React from 'react';
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';
import $ from 'jquery'
import Icon from '@ant-design/icons'

import styles from './style.less'
import { GridContent } from '@ant-design/pro-layout';
import { json } from 'body-parser';

const UserData = ycore.userData()

export default class __m extends React.Component {
  constructor(props){
    super(props),
    this.state = {
      s_id: '',
      coninfo: 'Getting info...',
      s_token: '',
      s_ses: ''
    };
  }

  componentDidMount() {
    if (ycore.IsThisUser.admin() == false) {
      return ycore.crouter.native('main')
    }
    this.handleSID()
    this.handleToken()
  }

  handleSID(){
    ycore.get_app_session.get_id((err, response)=> {
      if (err){
        return ycore.notifyError(err)
      }
      this.setState({ s_id: response})
    })
  }
  handleToken(){
    this.setState({ s_token: ycore.handlerYIDT.get() })
    {ycore.ValidLoginSession(res => {
     this.setState({s_ses: res})
    })}
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
    const { UserID, UserToken, deadline } = this.state.s_token
    const { ValidSDCP, ValidCookiesToken, final } = this.state.s_ses
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
              <h2><Icons.UserOutlined /> Current Session</h2>
              <p> UID => {UserID} </p>
              <p> Session Token => {UserToken} </p>
              <p> Deadline => {deadline} </p>
              <hr />
              <p> ValidSDCP => {JSON.stringify(ValidSDCP)} </p>
              <p> ValidCookiesToken => {JSON.stringify(ValidCookiesToken)} </p>
              <p> Valid? => {JSON.stringify(final)} </p>
         
            </antd.Card>
            <antd.Card>
              <span> Using v{ycore.AppInfo.version} | User @{UserData.username}#{UserData.id} | </span>  
            </antd.Card>
          </div>

          <div className={styles.titleHeader}>
            <h1><Icons.DeploymentUnitOutlined /> Test yCore™ </h1>
          </div>
          <div className={styles.sectionWrapper}>
            <antd.Button onClick={() => ycore.notifyError('Yep, its not empty, jeje funny')} > Send empty notifyError() </antd.Button>
            <antd.Button onClick={() => ycore.notifyError(`
            ycore.GetPosts(uid, get, '0', (err, result) => {
              const parsed = JSON.parse(result)['data']
              const isEnd = parsed.length < ycore.DevOptions.limit_post_catch? true : false
              this.setState({ isEnd: isEnd, data: parsed, loading: false })
            })`
            )} > Send mock notifyError() </antd.Button>
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
