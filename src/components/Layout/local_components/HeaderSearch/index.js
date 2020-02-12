import { AutoComplete, Icon, Input } from 'antd';
import { AutoCompleteProps, DataSourceItemType } from 'antd/es/auto-complete';
import React, { Component } from 'react';

import classNames from 'classnames';
import styles from './index.less'



export default class HeaderSearch extends Component {

  constructor(props) {
    super(props);
    this.state = {
      searchMode: '',
      value: ''
    };

  }

  render() {
    const { className, defaultValue, placeholder, open, ...restProps } = this.props;
    const { searchMode, value } = this.state;

    return (
      <span className={styles.headerSearch}>
        <Icon type="search" key="Icon" />
      
          <Input
            
            defaultValue={defaultValue}
            aria-label={placeholder}
            placeholder={placeholder}
            // onKeyDown={this.onKeyDown}
            // onBlur={this.leaveSearchMode}
          />
        
      </span>
    );
  }
}
