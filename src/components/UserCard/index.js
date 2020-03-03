import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

const userData = ycore.SDCP()
const { Meta } = antd.Card;
// Set default by configuration
const emptyPayload = {user: 'User Unknown', ago: 'This User is empty', avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png', content: 'Test Test' }


class UserCard extends React.PureComponent{
    constructor(props){
        super(props),
        this.state = {
           
        }
    }

    render(){
        const { source, } = this.props
        const { username, avatar, about, id  } = source || emptyPayload;
        const DevInfo = `ID #${id} | Developer ${ycore.booleanFix(source.dev)? 'yes' : 'no'} |`
        const AdminInfo = `Email ${source.email} | `
        return(
          <div className={styles.cardWrapper}>
             <antd.Card >
                <Meta
                    avatar={<div className={styles.postAvatar}><antd.Avatar shape="square" size={50} src={avatar} /></div>}
                    title={
                        <div className={styles.titleWrapper} >
                            <h4 onClick={() => ycore.crouter.native(`@${username}`)} className={styles.titleUser}>@{username} </h4> 
                        </div>}
                    description={ycore.booleanFix(userData.dev)? <span className={styles.textAgo}>{DevInfo} {AdminInfo}</span> : null}
                    bordered="false"
                />
                 <div className={styles.postContent}> <h3>{about}</h3></div> 
               
               
                
            </antd.Card>
          </div>
        )
    }
}
export default UserCard