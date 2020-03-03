import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import {CustomIconss} from 'components'
import { RefreshFeed } from 'components/MainFeed'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

const { Meta } = antd.Card;
const userData = ycore.SDCP();


const fileList = [];

  
const UploadProps = {
  name:'file',
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  multiple: true,
  listType: 'picture',
  defaultFileList: [...fileList],
  className: 'upload-list-inline',
};



export function HandleVisibility(){
    window.PostCreatorComponent.ToogleVisibility();
    return
}
class PostCreator extends React.PureComponent{
    constructor(props){
        super(props),
        window.PostCreatorComponent = this;
        this.state = {
            visible: true,
            FadeIN: true,
            keys_remaining: '512',
            toolbox_open: false,
            rawtext: '',
            posting: false,
            posting_ok: false,
            shareWith: 'any',
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
    HandlePublishPost = (e) => {
        const { rawtext, shareWith, postFile} = this.state;
        if(!rawtext){
            return null
        }
        this.setState({ posting: true, keys_remaining: '512' })
        ycore.PublishPost(ycore.GetPostPrivacy.bool(shareWith), rawtext, postFile, (err, res) => {
           if (err) {
               ycore.notifyError(err)
               return
           }
           this.setState({ posting_ok: true, posting: false, rawtext: ''})
           setTimeout( () => {this.setState({ posting_ok: false }) }, 1000)
           RefreshFeed()
        })
    }
   
    render(){
        const { keys_remaining, visible } = this.state;
        const percent = (((keys_remaining/ycore.DevOptions.MaxLengthPosts) * 100).toFixed(2) )
        const changeShare = ({ key }) => {
            this.setState({ shareWith: key })
        }
        const shareOptionsMenu = (
            <antd.Menu onClick={changeShare}>
              <antd.Menu.Item key="any">{ycore.GetPostPrivacy.decorator("any")}</antd.Menu.Item>
              <antd.Menu.Item key="only_follow">{ycore.GetPostPrivacy.decorator("only_follow")}</antd.Menu.Item>
              <antd.Menu.Item key="only_followers">{ycore.GetPostPrivacy.decorator("only_followers")}</antd.Menu.Item>
              <antd.Menu.Item key="private">{ycore.GetPostPrivacy.decorator("private")}</antd.Menu.Item>
            </antd.Menu>
          )
        if (visible) {
        return(
          <div className={styles.cardWrapper}>
             <antd.Card bordered="false">
                <div className={styles.inputWrapper}>
                    <div className={styles.titleAvatar}><img src={userData.avatar} /></div>
                    <antd.Input.TextArea disabled={this.state.posting? true : false} onPressEnter={this.HandlePublishPost} value={this.state.rawtext} autoSize={{ minRows: 3, maxRows: 5 }} dragable="false" placeholder="What are you thinking?" onChange={this.handleChanges} allowClear maxLength={ycore.DevOptions.MaxLengthPosts} rows={4} />
                    <div><antd.Button disabled={this.state.posting? true : (keys_remaining < 512? false : true)} onClick={this.HandlePublishPost} type="primary" icon={this.state.posting_ok? <Icons.CheckCircleOutlined/> : (this.state.posting? <Icons.LoadingOutlined /> : <Icons.ExportOutlined /> )} /></div>
                    
                </div>
                <div className={styles.progressHandler}><antd.Progress strokeWidth="4px" className={this.state.posting? styles.proccessUnset : (keys_remaining < 512? styles.proccessSet : styles.proccessUnset)} status={this.handleKeysProgressBar()}  showInfo={false} percent={percent} /></div>
                
                <div className={styles.postExtra} > 
                    <antd.Upload {...UploadProps}>
                        <antd.Button type="ghost"> <Icons.CameraFilled /></antd.Button>
                    </antd.Upload>
                   
                    <antd.Button type="ghost"> <Icons.VideoCameraFilled /></antd.Button>
                    <antd.Button onClick={this.handleToggleToolbox} type="ghost"><Icons.PlusCircleOutlined /></antd.Button>
                    <antd.Dropdown overlay={shareOptionsMenu}>
                        <a className={styles.shareWith} onClick={e => e.preventDefault()}>
                        {ycore.GetPostPrivacy.decorator(this.state.shareWith)}
                        </a>
                    </antd.Dropdown>
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