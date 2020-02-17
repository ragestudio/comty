import React, { Component } from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore' 
import YulioID from './components/YulioID.js'
import styles from './index.less';



class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showYulioID: true
    }
   
  }
  toogleYulioID(){
    this.setState({ showYulioID: !this.state.showYulioID })
  }

  render() {
    return (
      <div>
        <img src="https://dl.ragestudio.net/background.svg" className={styles.backgroud} />
        <div className={styles.loginLandingWrapper}>
          <div className={styles.brand} ><img src={ycore.AppInfo.logo} /> </div>
        </div>
        <div className={styles.prest}>
         {/* <img src="https://comty.julioworld.club/themes/comty27/img/backgrounds/group-chat.svg" /> */}
         {/* <div className={styles.loginbtn}><antd.Button onClick={() => this.toogleYulioID()} icon="login" > Login </antd.Button></div> */}
        </div>
        <div className={styles.version}><h2>{`v${ycore.AppInfo.version}`}</h2>{ycore.DetectNoNStableBuild('TagComponent')}</div>
        <YulioID visible={this.state.showYulioID} />
      </div>
      
    )
  }
}
export default Login
