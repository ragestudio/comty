import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Loader } from 'components'
import NProgress from 'nprogress'
import { withRouter, connect } from 'umi'
import { queryLayout } from 'core'
import config from 'config'

import PrimaryLayout from './PrimaryLayout'
import './BaseLayout.less'

const LayoutMap = {
  primary: PrimaryLayout
  // public: PublicLayout,
}

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class BaseLayout extends PureComponent {
  previousPath = ''

  render() {
    const { loading, children, location } = this.props
    const Container = LayoutMap[queryLayout(config.layouts, location.pathname)]

    const currentPath = location.pathname + location.search
    if (currentPath !== this.previousPath) {
      NProgress.start()
    }

    if (!loading.global) {
      NProgress.done()
      this.previousPath = currentPath
    }
    return (
      <Fragment>
        <Helmet>
          <title>{config.app_config.siteName}</title>
        </Helmet>
          {Loader(loading)}
          <Container>{children}</Container>
      </Fragment>
    )
  }
}

BaseLayout.propTypes = {
  loading: PropTypes.object,
}

export default BaseLayout
