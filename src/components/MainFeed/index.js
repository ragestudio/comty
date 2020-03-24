import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'

import { PostCard } from 'components'

export const RenderFeed = {
  RefreshFeed: () => {
    window.MainFeedComponent.FirstGet()
    return
  },
  killByID: post_id => {
    window.MainFeedComponent.killByID(post_id)
    return
  },
  addToRend: payload => {
    window.MainFeedComponent.addToRend(payload)
    return
  },
}
class MainFeed extends React.Component {
  constructor(props) {
    super(props)
    window.MainFeedComponent = this
    this.state = {
      invalid: false,
      loading: false,
      data: [],
      fkey: 0,
    }
  }

  componentDidMount() {
    this.FirstGet()
  }

  toogleLoader() {
    this.setState({ loading: !this.state.loading })
  }

  killByID(post_id) {
    const a = this.state.data
    const b = ycore.arrayRemoveByID(a, post_id)
    this.setState({ data: b })
  }

  addToRend(payload) {
    let a = this.state.data
    a.unshift(payload)
    this.setState({ data: a })
  }

  FirstGet() {
    try {
      const { get, uid, filters } = this.props
      if (this.props.custompayload) {
        this.setState({
          isEnd: true,
          data: this.props.custompayload,
          loading: false,
        })
        return
      }
      if (!get) {
        ycore.yconsole.error('Please, fill params with an catch type...')
        return
      }
      this.toogleLoader()
      const payload = { fkey: 0, type: get, id: uid }
      ycore.comty_post.getFeed((err, res) => {
        if (err) {
          ycore.notify.error('Error when get data from this input')
          return
        }
        if (JSON.parse(res).api_status == '400') {
          this.setState({ invalid: true })
          return
        }
        const parsed = JSON.parse(res)['data']

        const isEnd =
          parsed.length < ycore.AppSettings.limit_post_catch ? true : false
        this.setState({ isEnd: isEnd, data: parsed, loading: false })
      }, payload)
    } catch (err) {
      ycore.notify.error('err')
    }
  }

  GetMore(fkey) {
    try {
      const { get, uid, filters } = this.props
      if (!get) {
        ycore.yconsole.error('Please, fill params with an catch type...')
        return
      }
      if (!fkey) {
        ycore.yconsole.warn(
          'Please, provide a fkey for offset the feed, default using => 0'
        )
      }
      this.toogleLoader()
      const getLastPost = ycore.objectLast(this.state.data)
      ycore.yconsole.log('LAST POST ID =>', getLastPost.id)

      const payload = { fkey: getLastPost.id, type: get, id: uid }
      ycore.comty_post.getFeed((err, res) => {
        if (err) {
          return false
        }
        const oldData = this.state.data
        const parsed = JSON.parse(res)['data']
        const mix = oldData.concat(parsed)
        const isEnd =
          parsed.length < ycore.AppSettings.limit_post_catch ? true : false
        this.setState({ isEnd: isEnd, data: mix, loading: false }, () =>
          ycore.gotoElement(getLastPost.id)
        )
        return true
      }, payload)
    } catch (err) {
      ycore.notify.error(err)
    }
  }

  renderFeedPosts = () => {
    const { data, loading, isEnd } = this.state

    const loadMore =
      !isEnd && !loading ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}
        >
          <antd.Button
            type="ghost"
            icon={<Icons.DownSquareOutlined />}
            onClick={() => this.GetMore()}
          />
        </div>
      ) : null
    try {
      ycore.yconsole.log(data)
      return (
        <antd.List
          loadMore={loadMore}
          dataSource={data}
          renderItem={item => (
            <div id={item.id}>
              <PostCard payload={item} key={item.id} />
            </div>
          )}
        />
      )
    } catch (err) {
      return false
    }
  }

  render() {
    const { loading, invalid } = this.state
    return (
      <div id="mainfeed">
        {invalid ? (
          <antd.Card
            style={{
              borderRadius: '10px',
              maxWidth: '26.5vw',
              margin: 'auto',
              textAlign: 'center',
            }}
          >
            <h2>
              <Icons.ExclamationCircleOutlined /> Invalid Data{' '}
            </h2>
            <span>
              If this error has occurred several times, try restarting the app
            </span>
          </antd.Card>
        ) : loading ? (
          <antd.Card style={{ maxWidth: '26.5vw', margin: 'auto' }}>
            <antd.Skeleton avatar paragraph={{ rows: 4 }} active />
          </antd.Card>
        ) : (
          this.renderFeedPosts()
        )}
      </div>
    )
  }
}
export default MainFeed
