import React, { PureComponent } from 'react'
import { UserProfile } from 'components'
import { pathMatchRegexp } from 'utils'
import Error404 from '../404.js'
import * as app from 'app'

class PageIndexer extends PureComponent {
  render() {
    const { location } = this.props
    const matchUser = pathMatchRegexp('/@:id', location.pathname)

    if (matchUser) {
      app.yconsole.log(`User matched!  ${location.pathname}`)
      return (
        <div>
          <UserProfile {...this.props} regx={matchUser} />
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
