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
            keys_remaining: ycore.DevOptions.MaxLengthPosts,
            toolbox_open: false,
            rawtext: '',
            posting: false,
            posting_ok: false,
            shareWith: 'any',
            uploader: false,
        }
    }
    renderPostPlayer(payload){
        const {file, fileURL} = this.state
        const videofilter = file.type === 'video/mp4'
        const imagefilter = file.type === 'image/jpeg' || file.type === 'image/png'
        if (imagefilter) {
           return (
                <div className={styles.imagePreviewWrapper}>
                    <div className={styles.imageOverlay}>
                        <antd.Button onClick={() => null} icon={<Icons.DeleteOutlined />} />
                    </div>
                    <div className={styles.imagePreview}>
                        <img className={styles.imagePreview} src={fileURL} />
                    </div>
                    
                </div>
           )
        }
        if (videofilter) {
            return (
                <div className={styles.imagePreviewWrapper}>
                <video id="player" playsInline controls > 
                     <source className={styles.imagePreview} src={fileURL} type={file.type}/>
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
        this.setState({ uploader: !this.state.uploader })
    }

    handleFileUpload = info => {
        if (info.file.status === 'uploading') {
          this.setState({ loading: true });
          return;
        }
        if (info.file.status === 'done') {
          this.setState({ file: info.file.originFileObj, uploader: false })
          getBase64(info.file.originFileObj, fileURL =>
            this.setState({
              fileURL,
              loading: false,
            }),
          );
        }
    };

    beforeUpload = (file) => {
        const filter = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'video/mp4';
        if (!filter) {
          antd.message.error(`${file.type} This file is not valid!`);
        }
        const maxsize = file.size / 1024 / 1024 < ycore.DevOptions.MaximunAPIPayload;
        if (!maxsize) {
          antd.message.error(`Image must smaller than ${ycore.DevOptions.MaximunAPIPayload} KB!`);
        }
        return filter && maxsize;
    }

    handleChanges = ({ target: { value } }) => {
        this.setState({ rawtext: value, keys_remaining: (ycore.DevOptions.MaxLengthPosts - value.length) })
    }

    handleKeysProgressBar(){
        const { keys_remaining } = this.state;
        if (keys_remaining <= (ycore.DevOptions.MaxLengthPosts/100*30)) {
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
        if(!rawtext){
            return null
        }
        this.setState({ posting: true, keys_remaining: ycore.DevOptions.MaxLengthPosts })        
        ycore.PublishPost(ycore.GetPostPrivacy.bool(shareWith), rawtext, file, (err, res) => {
           if (err) {
               ycore.notifyError(err)
               return
           }
           this.FlushPostState()
           
        })
    }
    dropRef = React.createRef()

    handleDragIn = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (this.state.uploader == true) {
            return
        }
        this.setState({ uploader: true })
    }
    handleDragOut = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (this.state.uploader == false) {
            return
        }
        this.setState({ uploader: false })
    }

    componentDidMount() {
        let div = this.dropRef.current
        div.addEventListener('dragenter', this.handleDragIn)
        div.addEventListener('dragleave', this.handleDragOut)
    }  
    componentWillUnmount() {
      let div = this.dropRef.current
      div.removeEventListener('dragenter', this.handleDragIn)
      div.removeEventListener('dragleave', this.handleDragOut)
    }

    render(){
        const { keys_remaining, visible, fileURL, file } = this.state;
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
          
                <div ref={this.dropRef} className={styles.inputWrapper}>
               
                 {this.state.uploader? 
                    <div className={styles.uploader}>
                        <antd.Upload.Dragger 
                            multiple={false}
                            listType="picture"
                            showUploadList={false}
                            beforeUpload={this.beforeUpload}
                            onChange={this.handleFileUpload}
                        >
                            <Icons.CloudUploadOutlined />
                           <span>Drop your file here o click for upload</span>
                        </antd.Upload.Dragger>
                     </div> 
                     :  <>
                        <div className={styles.titleAvatar}><img src={userData.avatar} /></div>
                        <antd.Input.TextArea disabled={this.state.posting? true : false} onPressEnter={this.handlePublishPost} value={this.state.rawtext} autoSize={{ minRows: 3, maxRows: 5 }} dragable="false" placeholder="What are you thinking?" onChange={this.handleChanges} allowClear maxLength={ycore.DevOptions.MaxLengthPosts} rows={8} />
                        <div><antd.Button disabled={this.state.posting? true : (keys_remaining < ycore.DevOptions.MaxLengthPosts? false : true)} onClick={this.handlePublishPost} type="primary" icon={this.state.posting_ok? <Icons.CheckCircleOutlined/> : (this.state.posting? <Icons.LoadingOutlined /> : <Icons.ExportOutlined /> )} /></div>
                      
                    </> }
         
      
                     
                   
                </div>
                <div className={styles.progressHandler}><antd.Progress strokeWidth="4px" className={this.state.posting? styles.proccessUnset : (keys_remaining < 512? styles.proccessSet : styles.proccessUnset)} status={this.handleKeysProgressBar()} showInfo={false} percent={percent} /></div>
                {fileURL? this.renderPostPlayer(this.state.fileURL) : null}
                <div className={styles.postExtra} > 
                    <antd.Button styles={this.state.uploader? {fontSize: '20px'} : null} type="ghost" onClick={() => this.ToogleUpload()} > {this.state.uploader? <MICONS.Cancel /> : <MICONS.AddCircle />} </antd.Button>
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