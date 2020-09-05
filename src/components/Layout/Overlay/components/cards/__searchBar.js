import React from 'react'
import styles from './__searchBar.less'
import {newSearch} from "core/cores/interface_helper"

export default class __searchBar extends React.Component{
    state = {
      value: '',
    }
    openSearcher = () => {
      const { value } = this.state
      if (value.length < 1) return false
      if (value == /\s/) return false
      newSearch({ keyword: value });
    }
    onChange = e => {
      const { value } = e.target
      this.setState({ value: value })
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
              onKeyPress={this.handleKey}
          />
       </div>
      )   
    }
  }