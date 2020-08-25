import React from 'react'
import * as antd from 'antd'
import * as core from 'core'
import * as Icons from 'components/Icons'
import styles from './index.less'
import { connect } from 'umi'
import { stricts } from 'config'
import { settings, newSetting } from 'core/libs/settings'
import $ from 'jquery'

@connect(({ app }) => ({ app }))
class PostCreator extends React.PureComponent {
  constructor(props) {
    super(props), 
    this.state = {
      maxFileSize: stricts.api_maxpayload,
      maxTextLenght: stricts.post_maxlenght,

      renderValid: false,
      loading: false,

      textLenght: stricts.post_maxlenght,
      rawText: '',
      posting: false,
      postingResult: false,
      shareWith: 'any',

      uploader: false,
      uploaderFile: null,
      uploaderFileOrigin: null,
    },
    window.PostCreatorComponent = this
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

      core.getBase64(info.file.originFileObj, fileURL => {
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
    // Validate for render
    if (this.props.app.userData) {
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
    //       core.ReadFileAsB64(a, res => {
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

  render() {
    const { userData } = this.props.app
    const { textLenght, uploaderFile } = this.state

    const GetPostPrivacy = {
      bool: (e) => {
        switch (e) {
          case 'any':
              return '0'
          case 'only_followers':
              return '1'
          case 'only_follow':
              return '2'
          case 'private':
              return '3'
          default:
              return '0'
        }
      },
      decorator: (e) => {
          switch (e) {
              case 'any':
                  return  <span><Icons.GlobalOutlined /> Share with everyone</span>
              case 'only_follow':
                  return <span><Icons.TeamOutlined /> Share with people I follow</span>
              case 'only_followers':
                  return <span><Icons.UsergroupAddOutlined /> Share with people follow me</span> 
              case 'private':
                  return <span><Icons.EyeInvisibleOutlined /> Dont share, only me</span>
              default:
                  return <span>Unknown</span>
          }
      },
    }

    const shareOptionsMenu = (
      <antd.Menu onClick={key => this.setState({ shareWith: key })}>
        <antd.Menu.Item key="any">
          {GetPostPrivacy.decorator('any')}
        </antd.Menu.Item>
        <antd.Menu.Item key="only_follow">
          {GetPostPrivacy.decorator('only_follow')}
        </antd.Menu.Item>
        <antd.Menu.Item key="only_followers">
          {GetPostPrivacy.decorator('only_followers')}
        </antd.Menu.Item>
        <antd.Menu.Item key="private">
          {GetPostPrivacy.decorator('private')}
        </antd.Menu.Item>
      </antd.Menu>
    )

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


    const PostCreatorComponent = () => {
     return(
      <>
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
              <Icons.Cancel />
            ) : (
              <Icons.AddCircle />
            )}
          </antd.Button>
          <antd.Button type="ghost" onClick={() => null}>
            <Icons.Tune />
          </antd.Button>
          <antd.Dropdown overlay={shareOptionsMenu}>
            <a
              className={styles.shareWith}
              onClick={e => e.preventDefault()}
            >
              {GetPostPrivacy.decorator(this.state.shareWith)}
            </a>
          </antd.Dropdown>
        </div>
      </>
     )
    }

    const PostCreator_Invalid = () => {
      return(
        <div>
          <h3>This component cant be displayed!</h3>
          <antd.Skeleton active />
        </div>
      )
    }

    return (
        <div className={styles.cardWrapper}>
          <antd.Card bordered="false">
            { this.state.renderValid? <PostCreatorComponent /> : <PostCreator_Invalid /> }
          </antd.Card>
        </div>
      )
  }
}
export default PostCreator