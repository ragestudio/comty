import React from 'react'
import { pathMatchRegexp } from 'utils'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from 'components/Icons'

export default class Indexer_Post extends React.Component {
  constructor(props) {
    super(props),
      (this.state = {
        loading: true,
        swaped: false,
        UUID: '',
      })
  }

  toSwap(id) {
    const payload = { post_id: id }
    app.comty_post.get((err, res) => {
      if (err) {
        return false
      }
      app.SwapMode.openPost(res)
    }, payload)
  }

  componentDidMount() {
    try {
      const { location } = this.props
      const regexp = pathMatchRegexp('/p/:id', location.pathname)
      const match = regexp.shift().toString()

      const string = match.replace('/p/', '')
      this.setState({ UUID: string })
      if (string) {
        this.toSwap(string)
      }
    } catch (err) {
      app.notify.error(err)
    }
  }

  render() {
    app.router.go('main')
    return null
  }
}
