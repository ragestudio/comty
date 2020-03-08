import React, { PureComponent } from 'react'
import { pathMatchRegexp } from 'utils'
import { SearchCard } from 'components'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

const userData = ycore.SDCP()

class SearchPageIndexer extends PureComponent {
    constructor(props){
      super(props),
      this.state = {
        SearchResult: '',
        loading: true
      }
    }
    toogleLoading(){
      this.setState({loading: !this.state.loading})
    }
    componentDidMount(){
      try {
        const {location} = this.props
        const matchSearch = pathMatchRegexp("/s/:id", location.pathname);
        const parsed = matchSearch.shift()
        const raw = parsed.toString()
        const string = raw.replace('/s/', "")
        ycore.SeachKeywords(string, (exception, response) => {
          ycore.yconsole.log('Founded entries => ', JSON.parse(response))
          exception? ycore.notifyError(exception) : null
          this.setState({ SearchResult: response })
          this.toogleLoading()
        })
 
      } catch (err) {
        ycore.notifyError(err)
      }
    }

    renderResult = (source) => {
      try {
        const Empty = (
          <div>
            <antd.Result
              status="404"
              title="Nothing..."
              subTitle="Sorry, this does not exist."
            />
          </div>
        )
    
        // TO DO:  Settings serach & Post Search
        const usersParsed = JSON.parse(source)['users']
        const groupsParsed = JSON.parse(source)['groups']
        const pagesParsed = JSON.parse(source)['pages']
        
        const users = () => {if (usersParsed.length >= 1) {
          console.log('Users => ', usersParsed)
          return this.EntryComponent('Users', usersParsed)
        }}
        const groups = () => {if (groupsParsed.length >= 1) {
          console.log('Groups => ', groupsParsed)
          return this.EntryComponent('Groups', groupsParsed)
        }}
        const pages = () => {if (pagesParsed.length >= 1) {
          console.log('Pages => ', pagesParsed)
          return this.EntryComponent('Pages', pagesParsed)
        }}

        if (!usersParsed.length >= 1 && !groupsParsed.length >= 1 && !pagesParsed.length >= 1){
          return Empty
        }
        
        return [users(), groups(), pages()]
        
      } catch (error) {
        console.log(error)
        return <center><h2>Render Error</h2></center>
      }
    }
    EntryComponent = (t, source) => {
      try {
        return(
          <div>
            <antd.Typography.Title level={2} ><Icons.TeamOutlined /> {t} </antd.Typography.Title>
            <div className={styles.searchEntry}>
                <antd.List
                  grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 4,
                    lg: 4,
                    xl: 6,
                    xxl: 3,
                  }}
                  dataSource={source}
                  renderItem={item => (
                    <SearchCard type={t} source={item} />
                  )}
                />
             </div>
          </div>
        )

      } catch (error) {
        console.log(error)
        return <center><h2>Render Error</h2></center>
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
              <h1 className={styles.searchHeader}><Icons.SearchOutlined /> Results of {string} </h1>
                <antd.Card> 
                  <div className={styles.results}>
                     {this.state.loading? null : this.renderResult(this.state.SearchResult)}
                  </div>
                </antd.Card>
            </div>
        )
      }
      
      return(<div><center> Render Error </center></div>)
    }
}

export default SearchPageIndexer