import React, { Component } from 'react'
import BaseLayout from './BaseLayout'
import { withRouter } from 'umi'

@withRouter
class Layout extends Component {
  render() {
    const { children } = this.props
    return (
          <BaseLayout>{children}</BaseLayout>
    )
  }
}

export default Layout
