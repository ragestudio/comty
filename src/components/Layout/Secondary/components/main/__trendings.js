import React from 'react'
import * as antd from 'antd'
import { Feather } from 'components'
import styles from './__trendings.less'

import {Card_Component} from '../index.js'

export default class __trendings extends React.Component {
    state = {
      trendings: [],
      loading: true
    }
    componentDidMount(){
      const { data } = this.props
      if(data){
        this.setState({ trendings: data, loading: false })
      }
    }
  
    render(){
      if (this.state.loading) return <Card_Component type="skeleton" />
      return <Card_Component><h2><Feather.Award /> Trending now</h2>
  
      <div className={styles.trendings}>
        <antd.List
          dataSource={this.state.trendings}
          renderItem={item=>(
          <div className={styles.hash}>
            <span>#{item.tag}</span>
            <p> {item.trend_use_num} Posts</p>
          </div>)}
        />
      </div></Card_Component>
    }
  }