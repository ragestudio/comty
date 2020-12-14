import React from 'react'
import styles from './index.less'
import { Minus, X } from 'components/Icons'
import { connect } from 'umi';

@connect(({ app }) => ({ app }))
export default class WindowNavbar extends React.Component{
    handleMinimize(){
        this.props.dispatch({
            type: "app/ipcInvoke",
            payload: {
                key: "minimize-window"
            }
        })
    }
    handleClose(){
        this.props.dispatch({
            type: "app/ipcInvoke",
            payload: {
                key: "hide-window"
            }
        })
    }
    render(){
        if (!this.props.dispatch) return null
        return(
            <div className={styles.navbar} >
                <div className={styles.controls}>
                    <div><Minus onClick={() => this.handleMinimize()} /></div>
                    <div><X onClick={() => this.handleClose()}/></div>
                </div>
            </div>
        )
    }
}