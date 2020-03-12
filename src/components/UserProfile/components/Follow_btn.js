import React from 'react'
import styles from './Follow_btn.scss'
import classnames from 'classnames'

export default class Follow_btn extends React.Component{
    render(){
        return(
            <a className={classnames(styles.like_btn, {[styles.nofollowed]: !this.props.followed})} ><span>{this.props.followed? 'Following' : 'Follow'}</span></a>
        )
    }
}