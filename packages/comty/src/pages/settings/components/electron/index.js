import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'
import { connect } from 'umi';
import { package_json, objectToArrayMap } from 'core'

const AppTech = (info) => {
    if (!info) return null
    return(
        <div className={styles.versions}>
            <div>umi<antd.Tag>{info.g_umi.version}</antd.Tag></div>
            <div>react<antd.Tag>{info.react_version}</antd.Tag></div>
            <div><Icons.V8/><antd.Tag>{info.process.versions.v8}</antd.Tag></div>
            <div><Icons.NodeDotJs /><antd.Tag>{info.process.version}</antd.Tag></div>
            <div><Icons.Electron /><antd.Tag>{info.process.versions.electron}</antd.Tag></div>
            <div><Icons.Webpack /> Webpack </div>
            <div><Icons.SocketDotIo /> Socket.io </div>
            <div><Icons.Javascript /> JS </div>
            <div><Icons.Typescript /> TS </div>
            <div><Icons.Webassembly /> WebAssembly </div>
            <div><Icons.Openai /> OpenAI </div>
        </div>
    )
}


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
                process: window.process,
                react_version: React.version,
                deps: objectToArrayMap(package_json.dependencies)
            } 
        })
    }

    componentDidMount(){
        this.getInfo()
    }

    
    render(){
        const showAppTech = () => {
            antd.Modal.info({
                title: package_json.title,
                content: AppTech(this.state.info),
                width: 550
            })
        }

        const showThirdParty = () => {
            const generateList = () => {
                return this.state.info.deps.map((e) => {
                    return(
                        <div key={e.key}>
                            -> {e.key} <antd.Tag onClick={null} >{e.value.slice(1,e.value.length)}</antd.Tag>
                        </div>
                    )
                })
            }
            
            antd.Modal.info({
                title: package_json.title,
                content: generateList(),
                width: 550
            })
        }

        if (this.state.loading){
            return <antd.Skeleton active />
        }
        return(
            <div className={styles.main}>
                <antd.Button onClick={() => showAppTech()}> App Technologies </antd.Button>
                <antd.Button onClick={() => showThirdParty()}> Third-Party </antd.Button>
            </div>
        )
    }
}