import React from 'react'
import styles from './like_btn.scss'
import classnames from 'classnames'

export default class Like_btn extends React.Component{
    render(){
        return(
            <a className={classnames(styles.like_btn, {[styles.nofollowed]: !this.props.followed})} ><span>{this.props.followed? 'Following' : 'Follow'}</span></a>
        )
    }
}