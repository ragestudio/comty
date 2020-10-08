import React from 'react'
import { pathMatchRegexp } from 'core'
import { router } from 'core/libs/router'
import { Invalid } from 'components'

export default class UserIndexer extends React.Component {
  render() {
    const { location } = this.props
    const matchRegexp = pathMatchRegexp('/@/:id', location.pathname)
 
    if (matchRegexp) {
      return (
        <div style={{ height: "100%" }}>
          {matchRegexp[1]}
        </div>
      )   
    }
    return <Invalid type="index" messageProp1={location.pathname} />
  }
}

