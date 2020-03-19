import React from 'react'
import { pathMatchRegexp } from 'utils'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';


export default class Indexer_Post extends React.Component{
    constructor(props){
        super(props),
        this.state = {
          loading: true,
          swaped: false,
          UUID: ''
        }
    }

    toSwap(id){
      ycore.GetPostData(id, null, (err, res) => {
        if (err) { return false }
        ycore.SecondarySwap.openPost(res)
      })
    }

    componentDidMount(){
      try {
        const {location} = this.props
        const regexp = pathMatchRegexp("/p/:id", location.pathname)
        const match = regexp.shift().toString()
    
        const string = match.replace('/p/', "")
        this.setState({ UUID: string })
        if (string) {
          this.toSwap(string)
        }

      } catch (err) {
        ycore.notifyError(err)
      }
    }

    render(){
        ycore.crouter.native('main')
        return null
    }
}
