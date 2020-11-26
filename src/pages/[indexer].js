import React from 'react'
import Error404 from './404.js'

export default class PageIndexer extends React.Component {
  render() {
    const { location } = this.props
    
    // By default return Error 404
    return (
      <div>
        <Error404 />
      </div>
    )
  }
}