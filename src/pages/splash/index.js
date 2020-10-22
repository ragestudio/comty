import React from 'react'
import * as antd from 'antd'
import { connect } from 'umi'
import './index.less'

@connect(({ app }) => ({ app }))
export default class AppSplash extends React.Component {
    componentDidMount() {
        setTimeout(() => {
            document.querySelector(".js-logo").classList.remove("is-small")
        }, 1200)
    }
     //c-logo__svg-item c-logo__svg-item--out
    render() {
        return (
            <div className="c-logo js-logo is-small">
                <svg className="c-logo__svg" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 248.59 29.29">
                    <g>
                       
                        <polygon className="c-logo__svg-item c-logo__svg-item--move" points="248.59 16.72 233.28 7.36 233.28 11.4 243.69 18.3 233.28 25.2 233.28 29.25 248.59 19.95 248.59 16.72" />
                    </g>
                </svg>
            </div>
        )
    }
}