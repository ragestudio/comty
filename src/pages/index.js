import React, { PureComponent } from 'react'
import * as app from 'app'

class Index extends PureComponent {
  render() {
    app.router.go(`login`)
  }
}

export default Index
