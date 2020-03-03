import React from 'react'
import styles from './ChatSider.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@material-ui/icons';



class ChatSider extends React.Component {
    constructor(props){
        super(props),
        this.state = {
            collapsed: false,
        }
    }
    render(){
        const { collapsed } = this.state
        return(
            <div>
                  <antd.Layout.Sider
                      breakpoint="lg"
                      trigger={null}
                      collapsible
                      defaultCollapsed="true"
                      collapsedWidth="90"
                      width="180"
                      collapsed={collapsed}
                      className={styles.chatsider}
                    >
                    
                      <div className={styles.chatContainer}>
                        <div className={styles.chatTitle}> <h1>Chat</h1><Icons.ChatOutlined /></div>
                        <div className={styles.chatbox}>
	                        <div className={styles.friendslist}>
                                <div className={styles.search}>
                                    <antd.Input.Search placeholder="Search on Comty" onSearch={value => ycore.crouter.native(`s/${value}`)} enterButton />
                                </div>
                            </div>	
                        </div>
                    </div>
              </antd.Layout.Sider>
            </div>
        )
    }
}
export default ChatSider