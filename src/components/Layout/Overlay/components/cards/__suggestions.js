import React from 'react'
import { Feather } from 'components'
import styles from './__suggestions.less'

import {Card_Component} from '../index.js'

export default class __suggestions extends React.Component{
    state = {
      trendings: [],
      loading: true
    }
    componentDidMount(){
      const { data } = this.props
      if(data){
        this.setState({ trendings: data, loading: false })
      }
      if(!data){
        this.setState({ loading: false })
      }
    }
  
    render(){
      if (this.state.loading) return <Card_Component type="skeleton" />
      return <Card_Component>
      <div className={styles.suggestions_wrapper}>
            <h2><Feather.Target /> Suggestions</h2>
      </div>
      </Card_Component>
    }
  
  }