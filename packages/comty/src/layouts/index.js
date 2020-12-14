import React from 'react'
import BaseLayout from './BaseLayout'
import { withRouter } from 'umi'

@withRouter
class Layout extends React.Component {
  componentDidMount(){
    const appBody = document.getElementsByTagName("body")[0]
    appBody.setAttribute("id", "appWrapper")
  }
  render() {
    const { children } = this.props
    return (
          <BaseLayout>{children}</BaseLayout>
    )
  }
}

export default Layout
