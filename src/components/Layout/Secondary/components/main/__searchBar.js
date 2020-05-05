import React from 'react'
import * as ycore from 'ycore'
import styles from './__searchBar.less'

export default class __searchBar extends React.Component{
    state = {
      value: '',
    }
    openSearcher = () => {
      const { value } = this.state
      if (value.length < 1) return false
      if (value == /\s/) return false
      ycore.SwapMode.openSearch(value);
    }
    onChange = e => {
      const { value } = e.target
      this.setState({ value: value })
      if (ycore.AppSettings.auto_search_ontype == 'true') {
        this.autosend()
      }
    }
    handleKey = (e) =>{
      if (e.key == 'Enter') {
        this.openSearcher()
      }
    }
    render(){
      return(
        <div className={styles.search_bar}>
          <input
              placeholder="Search on Comty..."
              onChange={this.onChange}
              onPressEnter={this.openSearcher}
              onKeyPress={this.handleKey}
          />
       </div>
      )   
    }
  }