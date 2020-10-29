import React from 'react'
import classnames from 'classnames'
import './index.less'
import styles from './index.less'

export default class AppSplash extends React.Component {
    render() {
        console.log(this.props.fadeout)
        return (
            <div className={classnames(styles.wrapper, {[styles.fadeout]: this.props.fadeout})} style={this.props.fadeout? { animationDuration: `${this.props.fadeout}ms` } : null} >
                <div className="bouncy-logo">
                    <div className="ball">
                        <svg viewBox="0 0 100 120">
                            <path
                                d="M77.55 29.69L92 18.78a1.42 1.42 0 00.25-2 39.2 39.2 0 00-56.31-4.21A38.05 38.05 0 0023.23 42a38.09 38.09 0 003.62 15.1A38.65 38.65 0 0037.8 70.84 39.46 39.46 0 0083.37 73a38.26 38.26 0 008.41-7.4 1.41 1.41 0 00-.23-2L77.65 53a1.43 1.43 0 00-1.9.15 17 17 0 01-3.2 2.85 17.75 17.75 0 01-9 2.88c-8.32.31-13.62-5.69-14-6.13a17.68 17.68 0 01-4.13-10.13 17.93 17.93 0 014.56-13 17.46 17.46 0 0121.72-3.28 17.3 17.3 0 014 3.2 1.41 1.41 0 001.85.15z"
                                style={{
                                    backdropFilter: "blur(2px)",
                                }}
                                fill="rgba(51,51,51,.45)"
                            />
                            <path
                                d="M13 63.17a2.77 2.77 0 013.75 1.43 48.38 48.38 0 0015.32 19.93 48.83 48.83 0 0020.27 8.77 47.37 47.37 0 0040.23-11.5 2.77 2.77 0 014 .3l6.23 7.4a2.79 2.79 0 01-.21 3.83 63.83 63.83 0 01-6 5 62.21 62.21 0 01-7.44 4.7A60.84 60.84 0 0177 108a62.3 62.3 0 01-27 1.51 62.51 62.51 0 01-9.82-2.51A61.5 61.5 0 0120.1 95.69 61.73 61.73 0 012.41 71a2.79 2.79 0 011.42-3.55z"
                                style={{
                                    backdropFilter: "blur(2px)",
                                }}
                                fill="rgba(51,51,51,.45)"
                            />
                        </svg>
                    </div>
                    <div className="shadow"><div className="ball-shadow"></div></div>

                </div>
            </div>
        )
    }
}

export class AppSplash2 extends React.Component {
    render() {
        return (
            <div className="c-logo js-logo is-small">
                <svg className="c-logo__svg" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 248.59 29.29">
                    <g>
                        <polygon className="c-logo__svg-item c-logo__svg-item--arrow" points="248.59 16.72 233.28 7.36 233.28 11.4 243.69 18.3 233.28 25.2 233.28 29.25 248.59 19.95 248.59 16.72" />
                    </g>
                </svg>
            </div>
        )
    }
}