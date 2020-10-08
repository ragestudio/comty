import React from 'react'
import { pathMatchRegexp } from 'core'
import { router } from 'core/libs/router'
import { Invalid } from 'components'
import styles from './index.less'
import { user } from 'core/models'

import FollowButton from './components/follow'
import Menu from './components/menu'

import * as antd from 'antd'
import { connect } from 'umi'
const matchRegexp = pathMatchRegexp('/@/:id', location.pathname)

const __Avatar = "https://comty.pw/upload/photos/2020/09/MEmX2WskbYdqxxIfG1Ci_12_bf9ae629707074e3dde5b6ff4ccb1caf_avatar.jpeg?cache=1599917094"
const __Cover = "https://comty.pw/upload/photos/2020/09/ontbBGwvDruPxxHxzd7K_12_b36cb70f20df86ea77cd04005786bad7_cover.png?cache=1599917132" 
const __About = "Cum cum cum me gusta damme"
const __Followed = false
const __Followers = 150

class UserLayout extends React.Component{
  state = {
    styleComponent: "UserLayout",
    userString: matchRegexp[1],
    layoutData: {
      avatar: null,
      cover: null,
      about: null,
      followed: null,
      followers: null
    }
  }

  componentDidMount(){
    const { layoutData } = this.props
    if (layoutData) {
      this.setState({ layoutData: {...this.state.layoutData, ...layoutData} })
      console.log(this.state.layoutData)
    }
  }

  render(){
    const { styleComponent } = this.state
    const toStyles = e => styles[`${styleComponent}_${e}`]
    
    return(
      <div className={toStyles("wrapper")} >
          <div className={toStyles("cover")}>
            <img src={this.state.layoutData.cover} />
          </div>
          <div className={toStyles("header")}>

            <div className={toStyles("avatar")}>
              <antd.Avatar shape="square" src={this.state.layoutData.avatar} />
            </div>

            <div className={toStyles("title")}>
              <antd.Tooltip title={`${this.state.layoutData.followers ?? "Non-existent"} Followers`}>
                <h1>{this.state.userString}</h1>
              </antd.Tooltip>
            
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '100',
                  lineHeight: '0',
                  marginBottom: '5px',
                }}
                dangerouslySetInnerHTML={{
                  __html: this.state.layoutData.about,
                }}
              />
            </div>

            <div className={toStyles("options")}>
              <div><FollowButton followed={this.state.layoutData.follow} /></div>
            </div>
           
          </div>

          <div className={toStyles("content")}>
            
          </div>
      </div>
    )
  }
}

@connect(({ app }) => ({ app }))
export default class UserIndexer extends React.Component {
  state = {
    loading: true,
    response: null,
    layoutData: null
  }

  promiseState = async state => new Promise(resolve => this.setState(state, resolve));

  componentDidMount(){
    if (matchRegexp) {
      user.get.profileData({username: matchRegexp[1], server_key: this.props.app.server_key, access_token: this.props.app.session_token}, (err, res) => {
        if (err) {
          return false
        }
        try {
          const data = JSON.parse(res)["user_data"]
          const frame = {
            avatar: data.avatar,
            can_follow: data.can_follow,
            country_id: data.contry_id,
            about: data.about,
            cover: data.cover,
            is_pro: data.is_pro,
            lastseen: data.lastseen,
            points: data.points, 
            registered:data.registered, 
            user_id: data.user_id, 
            verified: data.verified, 
            birthday: data.birthday, 
            details: data.details
          }
         
          this.setState({ layoutData: frame, loading: false })
          console.log(frame)
          
        } catch (error) {
          console.log(error)
          return false
        }
      })
    }else{
      this.setState({ loading: false })
    }
  }
  render() {
    if (this.state.loading) {
      return <div style={{ display: "flex", width: "100%", justifyContent: "center", alignContent: "center" }}><antd.Card style={{ width: "100%" }} ><antd.Skeleton active /></antd.Card></div>
    }
    if (matchRegexp) {
      return <UserLayout layoutData={this.state.layoutData} /> 
    }
    return <Invalid type="index" messageProp1={location.pathname} />
  }
}

