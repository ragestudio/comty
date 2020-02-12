import React, { PureComponent } from 'react'
import { UserProfile } from 'components'
import { pathMatchRegexp } from 'utils'
import Error404 from '../404.js'
import * as ycore from 'ycore'

const userData = ycore.SDCP()

class PageIndexer extends PureComponent {
    componentDidMount(){
    
    }
    
  
    render() {
      const {location} = this.props

      const matchUser = pathMatchRegexp("/@:id", location.pathname);
      const matchSearch = pathMatchRegexp("/s/:id", location.pathname);

      if (matchUser) {
        console.log(`User matched!  ${location.pathname}`)
        return(<div>
          <UserProfile regx={matchUser} />
        </div>)
      }
      if (matchSearch) {
        console.log(`Search matched!  ${location.pathname}`)
        return(<div>
          <UserProfile regx={matchSearch} />
        </div>)
      }
      // By default return Error 404
      return(<div><Error404 /></div>)
    }
}

export default PageIndexer