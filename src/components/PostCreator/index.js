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
   
    ToogleVisibility(){
        this.setState({ visible: !this.state.visible })
    }

    ToogleUpload(){
        this.setState({ UploadActive: !this.state.UploadActive })
    }

    handleFileUpload = info => {
        console.log(info.file.originFileObj)
        if (info.file.status === 'uploading') {
          this.setState({ loading: true });
          return;
        }
        if (info.file.status === 'done') {
          this.ToogleUpload()
          // Get this url from response in real world.
          getBase64(info.file.originFileObj, imageUrl =>
            this.setState({
              imageUrl,
              loading: false,
            }),
          );
        }
    };

    beforeUpload(file) {
        console.log('before')
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
          message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
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

    handlePublishPost = (e) => {
        const { rawtext, shareWith, imageUrl } = this.state;
        let postFile;
        if (imageUrl) {
            console.log('EXIST                   ',imageUrl)
            postFile = imageUrl;
        }
        if(!rawtext){
            return null
        }
        this.setState({ posting: true, keys_remaining: '512' })
        console.log('to post    ',postFile)
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
    OpenControl = () =>{
        let controls = [(
            <div> <antd.Button onClick={() => this.ResetUpload()} icon={<Icons.DeleteOutlined />} /> </div>
        )]
        ycore.ControlBar.set(controls)
    }
    CloseControl = () =>{
        ycore.ControlBar.close()
    }
    ResetUpload (){
        this.setState({
            imageUrl: null
        })
        this.ToogleUpload()
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
                    { this.state.imageUrl? 
                        <div className={styles.imagePreviewWrapper}>
                            <img className={styles.imagePreview} src={this.state.imageUrl} /> 
                        </div> : null
                    }
                    <antd.Button type="ghost" onClick={() => this.ToogleUpload()} > <Icons.CameraFilled /></antd.Button>
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