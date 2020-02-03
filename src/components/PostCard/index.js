import React from 'react'
import * as antd from 'antd'
import styles from './index.less'

const { Meta } = antd.Card;

// Set default by configuration
const emptyPayload = {user: 'Post Empty', ago: 'This Post is empty', avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png', content: 'Test Test' }
const defaultActions = [<antd.Icon type="setting" key="setting" />,<antd.Icon type="edit" key="edit" />,<antd.Icon type="ellipsis" key="ellipsis" />]

class PostCard extends React.PureComponent{
    constructor(props){
        super(props)
    }
    render(){
        const { payload, customActions,  } = this.props
        const { user, ago, avatar, content } = payload || emptyPayload;
        const actions = customActions || defaultActions;
        return(
          <div className={styles.cardWrapper}>
             <antd.Card   >
                <Meta
                    avatar={<antd.Avatar shape="square" size={50} className={styles.postAvatar} src={avatar} />}
                    title={<h4 className={styles.titleUser}>@{user}</h4>}
                    description={<span className={styles.textAgo}>{ago}</span>}
                    bordered={false}
                />
                <div className={styles.postContent}>
                    <h3>{content}</h3>
                </div>
            </antd.Card>
          </div>
        )
    }
}
export default PostCard