import React from 'react'
import styles from './WindowAppBar.less'
import * as Icons from '@ant-design/icons'
const remote = {
    getCurrentWindow: () =>{
        return
    },
    handleFullRescale: () => {
        return 
    },
    app: {
        quit: () => {
            return
        }
    }
}
export default class WindowAppBar extends React.PureComponent {
    handleFullRescale(){
        return
        // const currentWindow = remote.getCurrentWindow()
        // if(currentWindow.isMaximized()) {
        //   currentWindow.unmaximize()
        // } else {
        //   currentWindow.maximize()
        // }
    }
    render(){
        return(
            <div className={styles.WindowAppBar}>
                <div className={styles.WindowControl}>
                    <Icons.MinusOutlined onClick={() => remote.getCurrentWindow().minimize() } id="minimize-button" />
                    <Icons.FullscreenOutlined onClick={() => this.handleFullRescale()} />
                    <Icons.CloseOutlined onClick={() => remote.app.quit()} id="close-button" />
                </div>
            </div>
        )
    }
}