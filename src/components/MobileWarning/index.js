import React from 'react'
import styles from './index.less'
import store from 'store'
import * as antd from 'antd'

export default class MobileWarning extends React.PureComponent {
  state = {
    resbypass: store.get('resbypass') || false,
  }

  ResByPassHandler = () => {
    this.setState({ resbypass: true })
  }

  render() {
    const { resbypass } = this.state

    if (resbypass == false) {
      return (
        <div className={styles.mobilewarning}>
          <antd.Result
            status="warning"
            title="Low resolution warning"
            extra={
              <div style={{ color: 'white' }}>
                <h3 style={{ color: 'white' }}>
                  This version of the application is not fully compatible with
                  the resolution of this screen, a higher resolution is
                  recommended for an optimal experience
                </h3>
                <span>Please choose an option to continue</span>
                <br />
                <br />
                <antd.Button
                  type="dashed"
                  onClick={() => this.ResByPassHandler()}
                >
                  Continue
                </antd.Button>
              </div>
            }
          />
        </div>
      )
    }
    return null
  }
}
