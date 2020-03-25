import React, { Component } from 'react'
import { AppInfo } from 'ycore'
import { YulioID } from 'components'
import styles from './index.less'
import classnames from 'classnames'

export function transitionToogle() {
  window.LoginComponent.setState({  
    transition: !window.LoginComponent.state.transition
  })
  window.LoginComponent.toogleYulioID()
}

class Login extends Component {
  constructor(props) {
    super(props)
    window.LoginComponent = this
    this.state = {
      showYulioID: true,
      transition: false
    }
  }
  toogleYulioID() {
    this.setState({ showYulioID: !this.state.showYulioID })
  }

  render() {
    return (
        <div className={classnames(styles.login_wrapper, {[styles.goOut]: this.state.transition})} >
          <svg
            className={styles.backgroud}
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            preserveAspectRatio="xMidYMax slice"
            strokeLinejoin="round"
            strokeMiterlimit="1.41421"
            clipRule="evenodd"
            viewBox="0 0 1920 1200"
          >
            <path
              className="vibrate-slow-1"
              fill="url(#_Linear1)"
              d="M1933-19s-273.175 481.215-543.607 443.874c-270.431-37.341-491.08-251.918-677.168-175.592-161.697 66.321-325.778 320.713-29.035 557.338 376.292 300.059 1119.66 396.359 1119.66 396.359l-1642.31 14.014V-1.247L1933-18.998z"
            />
            <path
              fill="url(#_Linear2)"
              d="M1690 0s-42.182 372.782-341 336c-298.818-36.782-466.852-265.409-693-161-226.148 104.409-350.389 405.447-147 722s193 303 193 303H0V0h1690z"
            />
            <defs>
              <linearGradient
                id="_Linear1"
                x2="1"
                gradientTransform="matrix(1772.46 0 0 1235.99 160.542 598.996)"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#513db6" />
                <stop offset="1" stopColor="#562590" />
              </linearGradient>
              <linearGradient
                id="_Linear2"
                x2="1"
                gradientTransform="matrix(1690 0 0 1200.08 0 600.042)"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#8137dd" />
                <stop offset="1" stopColor="#6143ef" />
              </linearGradient>
            </defs>
          </svg>

          <div className={styles.loginLandingWrapper}>
            <div className={styles.brand}>
              <img src={AppInfo.logo} />
            </div>
          </div>
          <div className={styles.version}>
            <h2>{`v${AppInfo.version} ${AppInfo.stage}`}</h2>
          </div>
          <YulioID visible={this.state.showYulioID} />
        </div>
    )
  }
}
export default Login
