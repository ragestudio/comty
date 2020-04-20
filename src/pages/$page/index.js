import React, { PureComponent } from 'react'
import { UserProfile } from 'components'
import __m from '../__m/index.js'
import { pathMatchRegexp } from 'utils'
import Error404 from '../404.js'
import * as ycore from 'ycore'

class PageIndexer extends PureComponent {
  render() {
    const { location } = this.props
    const matchUser = pathMatchRegexp('/@:id', location.pathname)
    const matchMaster = pathMatchRegexp('/__m', location.pathname)

    if (matchUser) {
      ycore.yconsole.log(`User matched!  ${location.pathname}`)
      return (
        <div>
          <UserProfile {...this.props} regx={matchUser} />
        </div>
      )
    }
    if (matchMaster) {
      return ycore.IsThisUser.dev() || ycore.IsThisUser.admin() ? (
        <__m />
      ) : (
        <Error404 />
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
