import React, { PureComponent } from 'react'
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
   
    componentDidMount(){
      try {
        const {location} = this.props
        const matchSearch = pathMatchRegexp("/s/:id", location.pathname);
        const parsed = matchSearch.shift()
        const raw = parsed.toString()
        const string = raw.replace('/s/', "")
        ycore.SeachKeywords(string, (exception, response) => {
          console.log(response)
          exception? ycore.notifyError(exception) : null
          this.setState({ SearchResult: response })
        })
 
      } catch (err) {
        ycore.notifyError(err)
      }
    }
  
    render() {
      const {location} = this.props
      const matchSearch = pathMatchRegexp("/s/:id", location.pathname);

      const parsed = matchSearch.shift()
      const raw = parsed.toString()
      const string = raw.replace('/s/', "")

      
      if (matchSearch) {
        
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