import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import {CustomIcons} from 'components'
import { RefreshFeed } from 'components/MainFeed'

const { Meta } = antd.Card;

export function HandleVisibility(){
    window.PostCreatorComponent.ToogleVisibility();
    return
}
class PostCreator extends React.PureComponent{
    constructor(props){
        super(props),
        window.PostCreatorComponent = this;
        this.state = {
            visible: false,
            FadeIN: true,
            keys_remaining: '512',
            toolbox_open: false,
            rawtext: '',
            posting: false,
            posting_ok: false
        }
    }
    ToogleVisibility(){
        this.setState({ visible: !this.state.visible })
    }
    renderPostPlayer(payload){
        const ident = payload
        if (ident.includes('.mp4')) {
           return (
                <video id="player" playsinline controls > 
                     <source src={payload} type="video/mp4"/>
                </video>
           )
        }
        if (ident.includes('.webm')) {
            return (
                <video id="player" playsinline controls > 
                     <source src={payload} type="video/webm"/>
                </video>
           )
        }
        if (ident.includes('.mp3')){
            return (
                <audio id="player" controls>
                    <source src={payload} type="audio/mp3" />
                </audio>
            )
        }
        if (ident.includes('.ogg')){
            return (
                <audio id="player" controls>
                    <source src={payload} type="audio/ogg" />
                </audio>
            )
        }
        else {
            return (
                <img src={payload} />
            )
        }
    }
    
    handleChanges = ({ target: { value } }) => {
        this.setState({ rawtext: value, keys_remaining: (ycore.DevOptions.MaxLengthPosts - value.length) })
    }
    handleKeysProgressBar(){
        const { keys_remaining } = this.state;
        if (keys_remaining <= 80) {
            return 'exception'
        }else return('active')
    }
    handleToggleToolbox = () =>{
        this.setState({ toolbox_open: !this.state.toolbox_open })
    }
    PublishPost = (e) => {
        const { rawtext } = this.state;
        const { refreshPull, toggleShow } = this.props
        
        if(!rawtext){
            return null
        }
        this.setState({ posting: true, keys_remaining: '512' })
        let formdata = new FormData();
        formdata.append("user_id", ycore.GetUserToken.decrypted().UserID);
        formdata.append("server_key", ycore.yConfig.server_key);
        formdata.append("postText", rawtext);
      
        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };  
        ycore.DevOptions.ShowFunctionsLogs? console.log(`Sending new post => ${rawtext} `) : null
        const urlObj = `${ycore.endpoints.new_post}${ycore.GetUserToken.decrypted().UserToken}`
        fetch(urlObj, requestOptions)
          .then(response => {
              ycore.DevOptions.ShowFunctionsLogs? console.log(response) : null
              this.setState({ posting_ok: true, posting: false, rawtext: ''})
              setTimeout( () => { this.ToogleVisibility(),this.setState({ posting_ok: false }) }, 1000)
              RefreshFeed()
             // console.warn(`[EXCEPTION] refreshPull or/and toogleShow is not set, the controller handlers not working...`)
              
            })
          .catch(error => console.log('error', error));
    }
   
    render(){
        const { keys_remaining, visible } = this.state;
        const percent = (((keys_remaining/ycore.DevOptions.MaxLengthPosts) * 100).toFixed(2) )
        if (visible) {
        return(
          <div className={styles.cardWrapper}>
             <antd.Card>
                <Meta
                    avatar={<div className={styles.titleIcon}><antd.Icon type="plus" /></div>}
                    title={<div><h4 className={styles.titlecreate}>Create a post </h4></div>}
                    description={<span className={styles.shareWith}>Share with everyone</span>}
                    bordered="false"
                />
                <div className={styles.inputWrapper}>
                    <antd.Input.TextArea disabled={this.state.posting? true : false} onPressEnter={this.PublishPost} value={this.state.rawtext} autoSize={{ minRows: 3, maxRows: 5 }} placeholder="What's going on?" onChange={this.handleChanges} allowClear maxLength={ycore.DevOptions.MaxLengthPosts} rows={4} />
                    <div><antd.Button disabled={this.state.posting? true : (keys_remaining < 512? false : true)} onClick={this.PublishPost} type="primary" icon={this.state.posting_ok? "check-circle" : (this.state.posting? "loading" : "export")} /></div>
                </div>
                <div className={styles.progressHandler}><antd.Progress strokeWidth="4px" className={this.state.posting? styles.proccessUnset : (keys_remaining < 512? styles.proccessSet : styles.proccessUnset)} status={this.handleKeysProgressBar()}  showInfo={false} percent={percent} /></div>
                <div className={styles.postExtra} > 
                    <antd.Button icon="upload" type="ghost"> Upload File </antd.Button>
                    <antd.Button onClick={this.handleToggleToolbox} icon="container" type="ghost"> Toolbox </antd.Button>
                    <antd.Button icon="setting" type="ghost"> Settings </antd.Button>
                </div>
             </antd.Card>
                <antd.Drawer
                     title={<h1 className={styles.fontct}> Toolbox </h1>}
                     placement="top"
                     closable={false}
                     onClose={this.handleToggleToolbox}
                     visible={this.state.toolbox_open}
                 >
                     <antd.Button icon="upload" type="ghost"> Create Poll </antd.Button>
                     <antd.Button icon="upload" type="ghost"> StickerPost </antd.Button>
                </antd.Drawer>
          </div>
        )
        }
        return null
    }
}          
export default PostCreator