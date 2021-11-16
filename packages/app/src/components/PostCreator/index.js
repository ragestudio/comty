import React from 'react'
import * as antd from 'antd'
import { imageToBase64 } from 'core'
import * as Icons from 'components/Icons'
import styles from './index.less'
import { connect } from 'umi'
import config from 'config'
import { settings, newSetting } from 'core/libs/settings'

const PrivacyList = [
  {
    id: 0,
    type: "any",
    icon: "Globe",
    decoratorText: "Share with everyone"
  },
  {
    id: 1,
    type: "only_followers",
    icon: "UserCheck",
    decoratorText: "Share with people I follow"
  },
  {
    id: 2,
    type: "only_follow",
    icon: "Users",
    decoratorText: "Share with people follow me"
  },
  {
    id: 3,
    type: "private",
    icon: "Shield",
    decoratorText: "Dont share, only me"
  },
  {
    id: 4,
    type: "anon",
    icon: "EyeOff",
    decoratorText: "Anonymous"
  }
]

@connect(({ app }) => ({ app }))
class PostCreator extends React.PureComponent {
  state = {
    maxFileSize: config.stricts.api_maxpayload,
    maxTextLenght: config.stricts.post_maxlenght,

    renderValid: false,
    loading: false,

    textLenght: config.stricts.post_maxlenght,
    rawText: '',
    posting: false,
    postingResult: false,
    privacity: 0,

    uploader: false,
    uploaderFile: null,
    uploaderFileOrigin: null,
  }

  dropRef = React.createRef()

  ToogleUploader() {
    this.setState({ uploader: !this.state.uploader })
  }

  handleDeleteFile = () => {
    this.setState({ uploaderFile: null })
  }

  handleFileUpload = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true })
    }
    if (info.file.status === 'done') {
      this.setState({ uploaderFileOrigin: info.file.originFileObj, uploader: false })

      imageToBase64(info.file.originFileObj, fileURL => {
        this.setState({ uploaderFile: fileURL, loading: false })
      })
    }
  }
  
  beforeUpload = file => {
    const filter =
      file.type === 'image/jpeg' ||
      file.type === 'audio/mp3' ||
      file.type === 'audio/wav' ||
      file.type === 'audio/ogg' ||
      file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'image/gif' ||
      file.type === 'video/mp4'
    if (!filter) {
      antd.message.error(`${file.type} This file is not valid!`)
    }
    const maxsize = file.size / 1024 / 1024 < stricts.api_maxpayload
    if (!maxsize) {
      antd.message.error(
        `Image must smaller than ${stricts.api_maxpayload} KB!`
      )
    }
    return filter && maxsize
  }

  handleChanges = ({ target: { value } }) => {
    this.setState({
      rawText: value,
      textLenght: this.state.maxTextLenght - value.length,
    })
  }

  handleKeysProgressBar() {
    return this.state.textLenght <= (this.state.maxTextLenght / 100) * 30? 'exception' : 'active'
  }
 
  handleDragIn = e => {
    e.preventDefault()
    e.stopPropagation()

    this.state.uploader? this.setState({ uploader: true }) : null
  }

  handleDragOut = e => {
    e.preventDefault()
    e.stopPropagation()

    this.state.uploader? null : this.setState({ uploader: false })
  }

  componentDidMount() {
    if (this.props.app.session_data) {
      this.setState({renderValid: true})
    }

    // const _this = this
    // $('body').bind('paste', function(je) {
    //   var e = je.originalEvent
    //   for (var i = 0; i < e.clipboardData.items.length; i++) {
    //     var item = e.clipboardData.items[i]
    //     if (item.type.indexOf('image') != -1) {
    //       //item.
    //       let a;
    //       a = item.getAsFile()
    //       _this.setState({ uploaderFileOrigin: a })
    //       ReadFileAsB64(a, res => {
    //         _this.setState({ uploaderFile: res })
    //       })
    //     } else {
    //       // ignore not images
    //     }
    //   }
    // })
    // let div = this.dropRef.current
    // div.addEventListener('dragenter', this.handleDragIn)
    // div.addEventListener('dragleave', this.handleDragOut)
  }

  componentWillUnmount() {
    // let div = this.dropRef.current
    // div.removeEventListener('dragenter', this.handleDragIn)
    // div.removeEventListener('dragleave', this.handleDragOut)
  }

  canPost() {
    const isTypedSomething = this.state.textLenght < this.state.maxTextLenght
    const isUploadedFile = this.state.uploaderFile ? true : false

    return isUploadedFile || isTypedSomething
  }

  renderShareOptions = () => {
    return PrivacyList.map(e => {
      if (!e) return null
      return(
        <antd.Menu.Item key={e.id}>
          {e.icon? React.createElement(Icons[e.icon]) : null} {e.decoratorText? e.decoratorText : "Bruh"}
        </antd.Menu.Item>
      )
    })
  }
  
  render() {
    const userData = this.props.app.session_data
    const { textLenght, uploaderFile } = this.state

    const ShareOptionsMenu = () => {
      return(
        <antd.Menu onClick={e => this.setState({ privacity: e.key })}>
          {this.renderShareOptions()}
        </antd.Menu>
      )
    }

    const PostCreator_Uploader = () => {
      return(
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
      )
    }

    const PostCreator_InputText = () => {
      return(
        <>
          <div className={styles.titleAvatar}>
            <img src={userData.avatar} />
          </div>
          <antd.Input.TextArea
            disabled={this.state.posting ? true : false}
            onPressEnter={this.handlePublishPost}
            value={this.state.rawText}
            autoSize={{ minRows: 3, maxRows: 5 }}
            dragable="false"
            placeholder="What are you thinking?"
            onChange={this.handleChanges}
            allowClear
            maxLength={this.state.maxTextLenght}
            rows={8}
          />
          <div>
            <antd.Button
              disabled={this.state.posting ? true : !this.canPost()}
              onClick={this.handlePublishPost}
              type="primary"
              icon={
                this.state.postingResult ? (
                  <Icons.CheckCircleOutlined />
                ) : this.state.posting ? (
                  <Icons.LoadingOutlined />
                ) : (
                  <Icons.ExportOutlined />
                )
              }
            />
          </div>
        </>
      )
    }


    if(!this.state.renderValid) return null
    return (
        <div className={styles.cardWrapper}>
          <antd.Card bordered="false">
          <div ref={this.dropRef} className={styles.inputWrapper}>
          {this.state.uploader ? <PostCreator_Uploader /> : <PostCreator_InputText /> }
        </div>
        <div className={styles.progressHandler}>
          <antd.Progress
            className={
              this.state.posting
                ? styles.proccessUnset
                : textLenght < 512
                ? styles.proccessSet
                : styles.proccessUnset
            }
            percent={((textLenght / this.state.maxTextLenght) * 100).toFixed(2)}
            status={this.handleKeysProgressBar()}
            strokeWidth="4px"
            showInfo={false}
          />
        </div>
        {uploaderFile ? this.renderPostPlayer(uploaderFile) : null}
        <div className={styles.postExtra}>
          <antd.Button
            styles={this.state.uploader ? { fontSize: '20px' } : null}
            type="ghost"
            onClick={() => this.ToogleUpload()}
          >

            {this.state.uploader ? (
              <Icons.XCircle style={{ margin: 0 }} />
            ) : (
              <Icons.Plus style={{ margin: 0, fontSize: '14px' }} />
            )}
          </antd.Button>
          <antd.Button type="ghost" onClick={() => null}>
            <Icons.Sliders style={{ margin: 0 }} />
          </antd.Button>
          <antd.Dropdown overlay={ShareOptionsMenu}>
            <a className={styles.shareWith} onClick={e => e.preventDefault()}>
              {PrivacyList[this.state.privacity].icon? React.createElement(Icons[PrivacyList[this.state.privacity].icon]) : null}
              {PrivacyList[this.state.privacity].decoratorText? PrivacyList[this.state.privacity].decoratorText : "Bruh"}
            </a>
          </antd.Dropdown>
        </div>
          </antd.Card>
        </div>
      )
  }
}
export default PostCreator