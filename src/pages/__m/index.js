import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import jwt from 'jsonwebtoken'

import styles from './style.less'
import MainFeed from '../../components/MainFeed'

const UserData = ycore.userData()

export default class __m extends React.Component {
  constructor(props) {
    super(props),
      (this.state = {
        s_id: '',
        coninfo: 'Getting info...',
        s_swtoken: '',
        s_ses: '',
      })
  }

  componentDidMount() {
    this.handleSID()
    this.handleToken()
  }

  handleSID() {
    ycore.comty_get.session_id((err, response) => {
      if (err) {
        return ycore.notify.error(err)
      }
      this.setState({ s_id: response })
    })
  }
  
  handleToken() {
    const a = ycore.token_data.getRaw()
    const b = jwt.decode(a)
    this.setState({ s_token: b })
    {
      ycore.validate.session(res => {
        this.setState({ s_ses: res })
      })
    }
  }

  render() {
    const { UserID, UserToken, expiresIn } = this.state.s_token

    const AddDummy = {
      id: '3',
      publisher: { id: '1' },
      post_id: '1',
      user_id: '48',
      recipient_id: '0',
      postText: 'New by ID Dummy Payload',
    }

    return (
      <div className={styles.Wrapper}>
        <div className={styles.titleHeader}>
          <h1>
            <Icons.DeploymentUnitOutlined /> yCore™ Server
          </h1>
        </div>
        <div className={styles.sectionWrapper}>
          <antd.Card>
            <h2>
              <Icons.CloudServerOutlined /> Server UID
            </h2>
            <span> {ycore.__server.getKey()} </span>
          </antd.Card>
          <antd.Card>
            <h2>
              <Icons.UserOutlined /> Your SID
            </h2>
            <span> {this.state.s_id} </span>
          </antd.Card>
          <antd.Card>
            <h2>
              <Icons.UserOutlined /> Current Session
            </h2>
            <p> Raw => {JSON.stringify(this.state.s_token)} </p>
            <br />
            <p> UID => {UserID} </p>
            <p> Session Token => {UserToken} </p>
            <p> expiresIn => {expiresIn} </p>
          </antd.Card>
          <antd.Card>
            <span>
              Using v{ycore.AppInfo.version} | User @{UserData.username}#
              {UserData.id} |
            </span>
          </antd.Card>
        </div>

        <div className={styles.titleHeader}>
          <h1>
            <Icons.DeploymentUnitOutlined /> Test yCore™
          </h1>
        </div>
        <div className={styles.sectionWrapper}>
         

          <antd.Button onClick={() => ycore.app_modals.report_post()}>
            Open report_post modal
          </antd.Button>
            
          <antd.Button onClick={() => ycore.sync.emmitPost()}>
            Emmit Post feed
          </antd.Button>

          <antd.Button onClick={() => ycore.SwapMode.openComment('1020')}>
            Open Comment
          </antd.Button>
        </div>

        <div className={styles.titleHeader}>
          <h1>
            <Icons.BugOutlined /> MainFeed | ENV Test
          </h1>
        </div>
        <div className={styles.sectionWrapper}>
          <antd.Card>
            <antd.Button onClick={() => ycore.FeedHandler.addToRend(AddDummy)}>
              
              ADD DUMMY
            </antd.Button>
            <antd.Button onClick={() => ycore.FeedHandler.killByID(3)}>
              
              KillByID (3)
            </antd.Button>
            <hr />
            <MainFeed
              custompayload={[
                {
                  id: '1',
                  publisher: { id: '1' },
                  post_id: '1',
                  user_id: '48',
                  recipient_id: '0',
                  postText: 'Dummy Payload',
                },
                {
                  id: '2',
                  post_id: '2',
                  publisher: { id: '1' },
                  user_id: '48',
                  recipient_id: '0',
                  postText: 'Dummy Payload',
                },
              ]}
            />
          </antd.Card>
        </div>
      </div>
    )
  }
}
