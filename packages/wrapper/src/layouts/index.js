import React from 'react'
import BaseLayout from './BaseLayout'
import { withRouter } from 'umi'
import './index.less'

@withRouter
export default class Layout extends React.Component {
  render() {
    const { children } = this.props
    return (
          <BaseLayout>{children}</BaseLayout>
    )
  }
}

