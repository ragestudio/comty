import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './Secondary.less'
import classnames from 'classnames'


export const SwapMode = {
    ext: () => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'ext'
        })
    },
    PostComments: (e) => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'post_comments',
            s_raw: e
        })
    }
}

export default class Secondary extends React.PureComponent{
    constructor(props){
        super(props),
        window.SecondaryLayoutComponent = this;
        this.state = {
            swap: false,
            mode: 'ext',
            s_raw: '',
            s_postData: '',
        }
    }
    
    renderMode(){
        const { mode } = this.state
        switch (mode) {
            case 'ext':
                return (
                    <h1></h1>
                )
            case 'post_comments':{
                   return(
                      <PostComments s_raw={this.state.s_raw} />
                   ) 
               }
        
            default:
                break;
        }
    }


    render(){
       const { userData } = this.props
        return(
            <div className={classnames(styles.SecondaryWrapper, {[styles.active]: this.state.swap })}> 
               
                <div className={styles.UserHeader}>
                  <div className={styles.notif_box}></div>
                  <img onClick={() => ycore.crouter.native(`@${userData.username}`)} src={userData.avatar} />
                </div>

                <div className={styles.container} >
                {this.state.swap? <antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => this.setState({ swap: !this.state.swap })} > Back </antd.Button> : null}
                <h1>container</h1>
                

                </div>

                <div className={classnames(styles.container_2, {[styles.active]: this.state.swap})}>
                    <h1>container_2</h1>
                </div> 
               
            
            </div>
        )
    }
}