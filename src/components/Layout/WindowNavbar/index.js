import React from 'react'
import styles from './index.less'
import * as Icons from 'components/Icons'
import { connect } from 'umi';

@connect(({ app }) => ({ app }))
export default class WindowNavbar extends React.Component{
    handleMinimize(){
        this.props.dispatch({
            type: "app/appControl",
            payload: "minimize-window"
        })
    }
    handleClose(){
        this.props.dispatch({
            type: "app/appControl",
            payload: "hide-window"
        })
    }
    render(){
        if (!this.props.dispatch) return null
        return(
            <div className={styles.navbar} >
                <div className={styles.controls}>
                    <div><Icons.Minus onClick={() => this.handleMinimize()} /></div>
                    <div><Icons.X onClick={() => this.handleClose()}/></div>
                </div>
            </div>
        )
    }
}