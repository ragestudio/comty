import React, { PureComponent } from 'react'
import * as ycore from 'ycore'

class Index extends PureComponent {
  render() {
    ycore.router.go(`login`)
  }
}

export default Index
