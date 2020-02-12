import React, { PureComponent } from 'react'
import { UserProfile } from 'components'
import { pathMatchRegexp } from 'utils'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'

const userData = ycore.SDCP()

class SearchPageIndexer extends PureComponent {
    constructor(props){
      super(props),
      this.state = {
        SearchResult: ''
      }
    }
    SeachKeywords(key){
      let formdata = new FormData();
      formdata.append("server_key", ycore.yConfig.server_key);
      formdata.append("search_key", key);
      const requestOptions = {
        method: 'POST',
        body: formdata,
      }
      const uriObj = (`${ycore.endpoints.search_endpoint}${ycore.GetUserToken.decrypted().UserToken}`)
      fetch(uriObj, requestOptions)
      .then(result => {
        console.log(result)
        this.setState({ SearchResult: result })
      
      })
      .catch(error => console.log('error', error));
    }
    
  
    render() {
      const {location} = this.props
      const matchSearch = pathMatchRegexp("/s/:id", location.pathname);

      const parsed = matchSearch.shift()
      const raw = parsed.toString()
      const string = raw.replace('/s/', "")

      
      if (matchSearch) {
        this.SeachKeywords(string)
        console.log(`Search matched!  ${location.pathname}`)
        return(
            <div>
              <h1 className={styles.searchHeader}><antd.Icon type="search" /> Results of {string} </h1>
              <antd.Card> 
              {this.state.SearchResult.toString()}
              </antd.Card>
            </div>
        )
      }
      
      return(<div><center> Input Error </center></div>)
    }
}

export default SearchPageIndexer