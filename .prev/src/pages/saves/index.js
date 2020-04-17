import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import { MainFeed } from 'components'
import styles from './index.less'

export default class PostSaved extends React.PureComponent{
    state = {
        loading: true,
        data: null,
    }
    componentDidMount(){
        ycore.comty_post.getSaved((err,res) => {
            if (err) return false
            try {
            const a = JSON.parse(res)['data']
            this.setState({ data: a, loading: false })
            } catch (error) {
                ycore.notify.exception('Error cathing saved posts... ', error)
            }
        })
    }
    renderSavedPost(){
        const { data } = this.state
        try {
            if (data.length < 1) {
            return <antd.Result title={`You don't have any saved posts`} />
            }
            return <MainFeed custompayload={data} />
        } catch (err) {
            
        }
    }
    render(){
        return(
            <div className={styles.saved_post_wrapper}>
                <div className={styles.saved_post_title}>
                    <h2><Icons.BookOutlined /> Saved Post</h2>
                </div>
                <div className={styles.saved_post_content}>
                    {this.renderSavedPost()}
                </div>
            </div>
        )
    }
}