import React, { PureComponent } from 'react'
import { pathMatchRegexp } from 'utils'
import { SearchCard } from 'components'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

class GroupIndexer extends PureComponent {
  constructor(props) {
    super(props),
      (this.state = {
        SearchResult: '',
        loading: true,
      })
  }
  toogleLoading() {
    this.setState({ loading: !this.state.loading })
  }
  componentDidMount() {
    try {
      const { location } = this.props
      const matchSearch = pathMatchRegexp('/s/:id', location.pathname)
      const parsed = matchSearch.shift()
      const raw = parsed.toString()
      const string = raw.replace('/s/', '')
    } catch (err) {
      ycore.notify.error(err)
    }
  }

  EntryComponent = (t, source) => {
    try {
      return (
        <div>
          <antd.Typography.Title level={2}>
            <Icons.TeamOutlined /> {t}{' '}
          </antd.Typography.Title>
          <div className={styles.searchEntry}>
            <antd.List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 4,
                lg: 4,
                xl: 6,
                xxl: 3,
              }}
              dataSource={source}
              renderItem={item => <SearchCard type={t} source={item} />}
            />
          </div>
        </div>
      )
    } catch (error) {
      return (
        <center>
          <h2>Render Error</h2>
        </center>
      )
    }
  }

  render() {
    const { location } = this.props
    const matchSearch = pathMatchRegexp('/g/:id', location.pathname)

    const parsed = matchSearch.shift()
    const raw = parsed.toString()
    const string = raw.replace('/g/', '')

    if (matchSearch) {
      return (
        <div>
          <h1 className={styles.searchHeader}>
            <Icons.SearchOutlined /> Results of {string}{' '}
          </h1>
          <antd.Card>
            <div className={styles.results}>
              {this.state.loading
                ? null
                : this.renderResult(this.state.SearchResult)}
            </div>
          </antd.Card>
        </div>
      )
    }

    return (
      <div>
        <center> Render Error </center>
      </div>
    )
  }
}

export default GroupIndexer
