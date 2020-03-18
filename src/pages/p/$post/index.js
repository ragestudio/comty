import React from 'react'
import { pathMatchRegexp } from 'utils'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';


export default class Indexer_Post extends React.Component{
    constructor(props){
        super(props),
        this.state = {
          loading: true
        }
    }

    componentDidMount(){
      try {
        const {location} = this.props
        const matchSearch = pathMatchRegexp("/s/:id", location.pathname);
        const parsed = matchSearch.shift()
        const raw = parsed.toString()
        const string = raw.replace('/s/', "")
        console.log(string)

      } catch (err) {
        ycore.notifyError(err)
      }
    }

    render(){
        return(
            <div>Ajam</div>
        )
    }
}
