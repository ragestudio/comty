import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'
import { connect } from 'umi';

@connect(({ app }) => ({ app }))
export default class ElectronSettings extends React.PureComponent{
    state = {
        loading: true,
        info: []
    }

    getInfo(){
        this.setState({ loading: true })
        this.setState({ 
            loading: false, 
            info: {
                g_umi: window.g_umi, 
                process: window.process
            } 
        })
    }

    componentDidMount(){
        this.getInfo()
    }

    render(){
        const { info } = this.state
        return(
            <div className={styles.main}>
            <h2>
              <Icons.Command /> Application Settings
            </h2>
            <div>
            { this.state.loading
                ? <antd.Skeleton active />
                : <div className={styles.versions}>
                    <div>umi<antd.Tag>{info.g_umi.version} </antd.Tag></div>
                    <div>react</div>
                    <div><Icons.V8/><antd.Tag>{info.process.versions.v8}</antd.Tag></div>
                    <div><Icons.NodeDotJs /><antd.Tag>{info.process.version}</antd.Tag></div>
                    <div><Icons.Electron /><antd.Tag>{info.process.versions.electron}</antd.Tag></div>
                    <div><Icons.Openssl /><antd.Tag>{info.process.versions.openssl}</antd.Tag></div>
                    <div><Icons.Css3 /> CCS3</div>
                    <div><Icons.Yarn /> Yarn </div>
                    <div><Icons.Npm /> npm </div>
                    <div><Icons.Jpeg /> .jpeg </div>
                    <div><Icons.Json /> JSON </div>
                    <div><Icons.Webgl /> WebGL </div>
                    <div><Icons.Auth0 /> Auth0 </div>
                    <div><Icons.Babel /> Babel </div>
                    <div><Icons.Redux /> Redux </div>
                    <div><Icons.Gitlab /> Gitlab </div>
                    <div><Icons.Jquery /> jQuery</div>
                    <div><Icons.Webpack /> Webpack </div>
                    <div><Icons.SocketDotIo /> Socket.io </div>
                    <div><Icons.Javascript /> JS </div>
                    <div><Icons.Typescript /> TS </div>
                    <div><Icons.Webassembly /> WebAssembly </div>
                    <div><Icons.Openai /> OpenAI </div>
                    <div><Icons.Hp /> HP </div>
                    <div><Icons.Simpleicons /> Simple Icons </div>
                    <div><Icons.Googlechrome /> Google Chrome </div>
                    <div><Icons.Visualstudiocode /> VisualStudio Code </div>
                </div> 
            }
            </div>
          </div>
        )
    }
}