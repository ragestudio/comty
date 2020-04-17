import React, { Component } from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import classnames from 'classnames'
import * as Icons from '@ant-design/icons'

export const SetHeaderSearchType = {
  disable: () => {
    window.HeaderSearchComponent.setState({ searchidden: true })
  },
  enable: () => {
    window.HeaderSearchComponent.setState({ searchidden: false })
  },
}
export default class HeaderSearch extends Component {
  constructor(props) {
    super(props)
    window.HeaderSearchComponent = this
    this.state = {
      value: '',
      searchidden: false,
      framelocation: 'primary',
    }
  }

  openSearcher = () => {
    const { value } = this.state
    if (value.length < 1) return false
    if (value == /\s/) return false
    ycore.SwapMode.openSearch(value);
  }

  sendToSearch = () => {
    const { value } = this.state
    ycore.router.go(`s/${value}`)
  }
  
  onChange = e => {
    const { value } = e.target
    this.setState({ value: value })
    if (ycore.AppSettings.auto_search_ontype == 'true') {
      this.autosend()
    }
  }

  autosend = () => {
    let timeout = null
    let input = document.getElementById('search_input')
    input.addEventListener('keyup', e => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const { value } = this.state
        ycore.router.go(`s/${value}`)
      }, 500)
    })
  }

  render() {
    const { searchidden } = this.state
    return (
      <div
        className={classnames(styles.HeaderSearchWrapper, {
          [styles.hidden]: searchidden,
        })}
      >
        <span className={styles.headerSearch}>
          <antd.Input
            id="search_input"
            prefix={<Icons.SearchOutlined />}
            placeholder=" Search on Comty..."
            onChange={this.onChange}
            onPressEnter={this.openSearcher}
          />
        </span>
      </div>
    )
  }
}
