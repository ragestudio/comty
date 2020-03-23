import React, { PureComponent } from 'react'
import * as ycore from 'ycore'

class Index extends PureComponent {
  render() {
    ycore.crouter.native(`login`)
  }
}

export default Index
