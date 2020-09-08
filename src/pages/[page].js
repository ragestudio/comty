import React, { PureComponent } from 'react'
import { pathMatchRegexp } from 'core'
import Error404 from './404.js'
// <UserProfile {...this.props} regx={matchUser} />

class PageIndexer extends PureComponent {
  render() {
    const { location } = this.props
    const matchUser = pathMatchRegexp('/@:id', location.pathname)
    const matchSetting = pathMatchRegexp('/~:id', location.pathname)
    console.log(matchSetting)
    if (matchUser) {
      return (
        <div>
          User, matched => {matchUser}
        </div>
      )
    }
    if (matchSetting) {
        return(
          <div>
              Bruh, matched => {matchSetting}
          </div>
        )
    }
    
    // By default return Error 404
    return (
      <div>
        <Error404 />
      </div>
    )
  }
}

export default PageIndexer
