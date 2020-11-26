import React from 'react'
import { pathMatchRegexp, booleanFix, __legacy__objectToArray } from 'core'
import HandleError from 'core/libs/errorhandler'
import { Invalid } from 'components'
import styles from './index.less'
import GlobalBadges from 'globals/badges_list.json'
import * as Icons from 'components/Icons'

import FollowButton from './components/follow'
import Menu from './components/menu'
import { PostsFeed } from 'components'

import * as antd from 'antd'
import { connect } from 'umi'
import { verbosity } from '../../core/libs'

export class UserLayout extends React.Component {
  state = {
    styleComponent: "UserLayout",
    userString: pathMatchRegexp('/@/:id', location.pathname)[1],
    layoutData: {
      avatar: null,
      cover: null,
      about: null,
      followed: null,
      followers: null
    }
  }

  handleClickFollow(user_id) {
    if (typeof (this.props.onFollow) !== "undefined") {
      this.updateFollow(!booleanFix(this.state.layoutData.is_following))

      this.props.onFollow(user_id, (callback) => {
        this.updateFollow(callback)
      })
    }
  }

  updateFollow(to) {
    let updated = this.state.layoutData
    updated.is_following = to
    this.setState({ layoutData: updated })
  }

  componentDidMount() {
    const { layoutData } = this.props
    if (layoutData) {
      this.setState({ layoutData: { ...this.state.layoutData, ...layoutData } })
    }
  }

  renderUserBadges() {
    let { layoutData } = this.state
    if (typeof(layoutData.user_tags) == "undefined") {
      return null
    }
    let userTags = __legacy__objectToArray(layoutData.user_tags)
    let renderTags = []

    if (!userTags) {
      return null
    }

    try {
      userTags = JSON.parse(userTags[0].value.badges)
    } catch (error) {
      console.log(error)
    }
    
    if (!userTags) {
      return null
    }

    __legacy__objectToArray(GlobalBadges).forEach(e => {
      if(userTags.includes(e.value.id)) {
        renderTags.push(e.value)
      }
    })

    try {
      if (Array.isArray(userTags)) {
        return renderTags.map((element) => {
          return(
            <antd.Tooltip key={element.key ?? Math.random()} title={element.tip} >
              <antd.Tag icon={React.createElement(Icons[element.icon]) ?? null} key={element.key ?? Math.random()} color={element.color ?? "default"} >
                {element.title ?? "maybe"}
              </antd.Tag>
            </antd.Tooltip>
          )
        })
      }
    } catch (error) {
      return null
    }
    return null
  }

  render() {
    const { styleComponent } = this.state
    const toStyles = e => styles[`${styleComponent}_${e}`]
    const { followers_count } = this.state.layoutData.details ?? {}
    const isFollowed = booleanFix(this.state.layoutData.is_following)

    if (!this.state.layoutData) {
      return null
    }
    return (
      <div className={toStyles("wrapper")} >
        <div className={toStyles("cover")}>
          <img src={this.state.layoutData.cover} />
        </div>
        <div className={toStyles("header")}>

          <div className={toStyles("avatar")}>
            <antd.Avatar shape="square" src={this.state.layoutData.avatar} />
          </div>
          <div className={toStyles("title")}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "7px" }} >
              {/* {this.renderUserBadges()} */}
            </div>
            <antd.Tooltip title={`${followers_count ?? "Non-existent"} Followers`}>
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
                __html: typeof(this.state.layoutData.about) == "string"? this.state.layoutData.about : null,
              }}
            />
          </div>

          <div className={toStyles("options")}>
            <div><FollowButton onClick={() => { this.handleClickFollow(this.state.layoutData.user_id) }} followed={isFollowed} /></div>
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
    ErrorCode: null,
    loading: true,
    response: null,
    layoutData: null
  }

  promiseState = async state => new Promise(resolve => this.setState(state, resolve));

  handleClickFollow(user_id, callback) {
    if (this.props.app.session_valid) {
      const requestCallback = (callbackResponse) => {
        if (callbackResponse.code == 200) {
          const response = callbackResponse.response
          const result =( response.follow ?? false) == "followed" ? true : false
          if (typeof(response) !== "undefined") {
            return callback(result)
          }else{
            return false
          }
        }else{
          return callback(null)
        }
      }

      this.props.dispatch({
        type: "socket/use",
        scope: "users",
        invoke: "actions",
        query: {
          payload: {
            userToken: this.props.app.session_token,
            action: "follow",
            user_id,
          },
          callback: requestCallback
        }
      })
    }else{
      verbosity(`Need auth`)
    }
    
  }

  componentDidMount() {
    const matchRegexp = pathMatchRegexp('/@/:id', location.pathname)

    if (matchRegexp && this.props.app.session_valid) {
      this.props.dispatch({
        type: "user/get",
        payload: {
          from: "profileData",
          username: matchRegexp[1]
        },
        callback: (callbackResponse) => {
          if (callbackResponse.code == 200) {
            this.setState({ loading: false, layoutData: callbackResponse.response })
          } else {
            this.setState({ ErrorCode: callbackResponse.code })
            return HandleError({ code: callbackResponse.code, msg: "no message provided" })
          }

        }
      })
    } else {
      this.setState({ ErrorCode: 140 })
    }
  }
  render() {
    if (this.state.ErrorCode) {
      return <Invalid typeByCode={this.state.ErrorCode} messageProp1={location.pathname} />
    }
    if (this.state.loading) {
      return <div style={{ display: "flex", width: "100%", justifyContent: "center", alignContent: "center" }}><antd.Card style={{ width: "100%" }} ><antd.Skeleton active /></antd.Card></div>
    }
    return (
      <div>
        <UserLayout onFollow={(...context) => {this.handleClickFollow(...context)}} layoutData={this.state.layoutData} />
        <PostsFeed from="user" fromID={this.state.layoutData.user_id} />
      </div>

    )
  }
}

