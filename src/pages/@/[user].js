import React from 'react'
import { pathMatchRegexp } from 'core'
import { router } from 'core/libs/router'
import { Invalid } from 'components'
import styles from './index.less'

import * as antd from 'antd'
import { connect } from 'umi'
const matchRegexp = pathMatchRegexp('/@/:id', location.pathname)

const __Avatar = "https://comty.pw/upload/photos/2020/09/MEmX2WskbYdqxxIfG1Ci_12_bf9ae629707074e3dde5b6ff4ccb1caf_avatar.jpeg?cache=1599917094"
const __Cover = "https://comty.pw/upload/photos/2020/09/ontbBGwvDruPxxHxzd7K_12_b36cb70f20df86ea77cd04005786bad7_cover.png?cache=1599917132" 

@connect(({ app }) => ({ app }))
class UserLayout extends React.Component{
  state = {
    styleComponent: "UserLayout",
    userString: matchRegexp[1],
  }

  componentDidMount(){

  }

  render(){
    const { styleComponent } = this.state
    const toStyles = e => styles[`${styleComponent}_${e}`]
    
    return(
      <div className={toStyles("wrapper")} >
          <div className={toStyles("cover")}>
            <img src={__Cover} />
          </div>
          <div className={toStyles("header")}>

            <div className={toStyles("avatar")}>
              <antd.Avatar shape="square" src={__Avatar} />
            </div>

            <div className={toStyles("title")}>
              <h1>{this.state.userString}</h1>
            </div>

          </div>

          <div className={toStyles("content")}>
            
          </div>
      </div>
    )
  }
}


export default class UserIndexer extends React.Component {
  render() {
    const { location } = this.props
    if (matchRegexp) {
      return <UserLayout /> 
    }
    return <Invalid type="index" messageProp1={location.pathname} />
  }
}

