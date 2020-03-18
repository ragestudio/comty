import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './Secondary.less'


export default class SecondaryHeader extends React.Component{
    render(){
        const userData = this.props;

        return(
            <div className={styles.SecondHeader}>
              <div className={styles.notif_box}></div>
              <img onClick={() => ycore.crouter.native(`@${userData.username}`)} src={userData.avatar} />
            </div>
        )
    }
}