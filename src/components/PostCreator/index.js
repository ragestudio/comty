import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import {CustomIconss} from 'components'
import { RefreshFeed } from 'components/MainFeed'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'
import * as MICONS from '@material-ui/icons'

const { Meta } = antd.Card;
const userData = ycore.SDCP();


function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  }


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
            UploadActive: false,
        }
    }
    renderPostPlayer(payload){
        const {file, fileURL} = this.state
        const videofilter = file.type === 'video/mp4'
        const imagefilter = file.type === 'image/jpeg' || file.type === 'image/png'
        if (imagefilter) {
           return (
                <div className={styles.imagePreviewWrapper}>
                    <img className={styles.imagePreview} src={fileURL} />
                </div>
           )
        }
        if (videofilter) {
            return (
                <div className={styles.imagePreviewWrapper}>
                <video id="player" playsInline controls > 
                     <source className={styles.imagePreview} src={file} type={file.type}/>
                </video>
                </div>
            )
        }
        return null
       
    }
    ToogleVisibility(){
        this.setState({ visible: !this.state.visible })
    }

    ToogleUpload(){
        this.setState({ UploadActive: !this.state.UploadActive })
    }

    handleFileUpload = info => {
        if (info.file.status === 'uploading') {
          this.setState({ loading: true });
          return;
        }
        if (info.file.status === 'done') {
          this.ToogleUpload()
          this.setState({ file: info.file.originFileObj })
          getBase64(info.file.originFileObj, fileURL =>
            this.setState({
              fileURL,
              loading: false,
            }),
          );
        }
    };

    beforeUpload(file) {
        const filter = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'video/mp4';
        if (!filter) {
          antd.message.error('Invalid File!');
        }
        const maxsize = file.size / 1024 / 1024 < ycore.DevOptions.MaximunAPIPayload;
        if (!maxsize) {
          antd.message.error('Image must smaller than 99MB!');
        }
        return filter && maxsize;
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

    FlushPostState(){
        this.setState({ 
            posting_ok: true, 
            posting: false, 
            rawtext: '', 
            fileURL: '',
            file: ''
        })
        setTimeout( () => {this.setState({ posting_ok: false }) }, 1000)
        RefreshFeed()
        return true
    }

    handlePublishPost = (e) => {
        const { rawtext, shareWith, file } = this.state;
        if(!rawtext || !file){
            return null
        }
        this.setState({ posting: true, keys_remaining: '512' })        
        ycore.PublishPost(ycore.GetPostPrivacy.bool(shareWith), rawtext, file, (err, res) => {
           if (err) {
               ycore.notifyError(err)
               return
           }
           this.FlushPostState()
           
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
                    {this.state.UploadActive? 
                    <div className={styles.uploader}>
                        <antd.Upload.Dragger 
                            multiple={false}
                            listType="picture"
                            showUploadList={false}
                            beforeUpload={this.beforeUpload}
                            onChange={this.handleFileUpload}
                        >
                            <div>
                                <p className="ant-upload-drag-icon">
                                  <Icons.InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <span>*Allowed PNG, JPG, MP4 </span>
                            </div>
                        </antd.Upload.Dragger>
                     </div>
                     :
                    <>
                        <div className={styles.titleAvatar}><img src={userData.avatar} /></div>
                        <antd.Input.TextArea disabled={this.state.posting? true : false} onPressEnter={this.handlePublishPost} value={this.state.rawtext} autoSize={{ minRows: 3, maxRows: 5 }} dragable="false" placeholder="What are you thinking?" onChange={this.handleChanges} allowClear maxLength={ycore.DevOptions.MaxLengthPosts} rows={4} />
                        <div><antd.Button disabled={this.state.posting? true : (keys_remaining < 512? false : true)} onClick={this.handlePublishPost} type="primary" icon={this.state.posting_ok? <Icons.CheckCircleOutlined/> : (this.state.posting? <Icons.LoadingOutlined /> : <Icons.ExportOutlined /> )} /></div>
                    </>}
                </div>
                <div className={styles.progressHandler}><antd.Progress strokeWidth="4px" className={this.state.posting? styles.proccessUnset : (keys_remaining < 512? styles.proccessSet : styles.proccessUnset)} status={this.handleKeysProgressBar()}  showInfo={false} percent={percent} /></div>
                
                <div className={styles.postExtra} > 
                    { this.state.file? 
                        this.renderPostPlayer() : null
                    }
                    <antd.Button type="ghost" onClick={() => this.ToogleUpload()} > <MICONS.AddCircle /></antd.Button>
                    <antd.Button type="ghost" onClick={this.handleToggleToolbox} ><MICONS.Tune /></antd.Button>
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