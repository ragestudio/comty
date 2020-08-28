import React from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Loader } from 'components'
import NProgress from 'nprogress'
import { withRouter, connect } from 'umi'
import { queryLayout } from 'core'
import WindowNavbar from 'components/Layout/WindowNavbar'
import config from 'config'

import PrimaryLayout from './PrimaryLayout'
import PublicLayout from './PublicLayout'
import './BaseLayout.less'

const LayoutMap = {
  primary: PrimaryLayout,
  public: PublicLayout,
}

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class BaseLayout extends React.Component {
  previousPath = ''
  renderLoading = true

  render() {
    const { loading, children, location } = this.props
    const Container = LayoutMap[queryLayout(config.layouts, location.pathname)]
    const currentPath = location.pathname + location.search

    if (currentPath !== this.previousPath) {
      NProgress.start()
      this.renderLoading = true
    }

    if (!loading.global) {
      NProgress.done()
      this.previousPath = currentPath
      this.renderLoading = false
    }

    return (
      <React.Fragment>
        <Helmet>
          <title>{config.app_config.siteName}</title>
        </Helmet>
        {this.props.app.electron? <WindowNavbar /> : null}
        {Loader(this.renderLoading)}
        <Container>{children}</Container>
      </React.Fragment>
    )
  }
}

BaseLayout.propTypes = {
  loading: PropTypes.object,
}

export default BaseLayout
