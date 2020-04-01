import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'
import $ from 'jquery'
import * as MICONS from '@material-ui/icons'

import Post_options from './local_components/post_options'
import { optionBox } from './local_components/post_options'

function getBase64(img, callback) {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result))
  reader.readAsDataURL(img)
}

export function HandleVisibility() {
  window.PostCreatorComponent.ToogleVisibility()
}

class PostCreator extends React.PureComponent {
  constructor(props) {
    super(props), 
    window.PostCreatorComponent = this,
    this.state = {
      visible: true,
      FadeIN: true,
      keys_remaining: ycore.AppSettings.MaxLengthPosts,
      rawtext: '',
      posting: false,
      posting_ok: false,
      shareWith: 'any',
      uploader: false,
      Schedule: false,
    }
  }

  renderPostPlayer(payload) {
    const { file, fileURL } = this.state
    const videofilter = file.type.includes('video')
    const imagefilter = file.type.includes('image')
    const audiofilter = file.type.includes('audio')
    if (imagefilter) {
      return (
        <div className={styles.imagePreviewWrapper}>
          <div className={styles.imageOverlay}>
            <antd.Button
              onClick={() => this.handleDeleteFile()}
              icon={<Icons.DeleteOutlined />}
            />
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
          <div className={styles.imageOverlay}>
            <antd.Button
              onClick={() => this.handleDeleteFile()}
              icon={<Icons.DeleteOutlined />}
            />
          </div>
          <div className={styles.imagePreview}>
            <video id="player" playsInline controls>
              <source
                className={styles.imagePreview}
                src={fileURL}
                type={file.type}
              />
            </video>
          </div>
        </div>
      )
    }
    if (audiofilter) {
      return (
        <audio controls src={fileURL} preload="auto" />
      )
    }
    return null
  }
  ToogleVisibility() {
    this.setState({ visible: !this.state.visible })
  }
  ToogleUpload() {
    this.setState({ uploader: !this.state.uploader })
  }
  handleDeleteFile = () => {
    this.setState({ fileURL: null })
  }
  handleFileUpload = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true })
      return
    }
    if (info.file.status === 'done') {
      this.setState({ file: info.file.originFileObj, uploader: false })
      getBase64(info.file.originFileObj, fileURL => {
        this.setState({ fileURL, loading: false })
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
    const maxsize =
      file.size / 1024 / 1024 < ycore.AppSettings.MaximunAPIPayload
    if (!maxsize) {
      antd.message.error(
        `Image must smaller than ${ycore.AppSettings.MaximunAPIPayload} KB!`
      )
    }
    return filter && maxsize
  }

  handleChanges = ({ target: { value } }) => {
    this.setState({
      rawtext: value,
      keys_remaining: ycore.AppSettings.MaxLengthPosts - value.length,
    })
  }

  handleKeysProgressBar() {
    const { keys_remaining } = this.state
    if (keys_remaining <= (ycore.AppSettings.MaxLengthPosts / 100) * 30) {
      return 'exception'
    } else return 'active'
  }

  FlushPostState() {
    this.setState({
      posting_ok: true,
      posting: false,
      rawtext: '',
      fileURL: '',
      file: '',
    })
    setTimeout(() => {
      this.setState({ posting_ok: false })
    }, 1000)
    ycore.FeedHandler.refresh()
    return true
  }

  handlePublishPost = e => {
    const { rawtext, shareWith, file, fileURL} = this.state
    if (!rawtext && !fileURL) {
      return false
    }
    this.setState({
      posting: true,
      keys_remaining: ycore.AppSettings.MaxLengthPosts,
    })
    const post_options = optionBox.get()

    const payload = {
      privacy: ycore.GetPostPrivacy.bool(shareWith),
      text: rawtext,
      file: file,
    }
    ycore.comty_post.new((err, res) => {
      if (err) {
        ycore.notify.error(err)
        return false
      }
      const status_temp_error = JSON.parse(res)['data'].error
      status_temp_error? ycore.notify.error('It seems that a processing error has occurred, your publication has not been published.') : null
      const id_temp_parse = JSON.parse(res)['data'].id
      
      const pro_boost_val = ycore.ReturnValueFromMap({ data: post_options, key: 'pro_boost' })
      const allow_comments_val = ycore.ReturnValueFromMap({ data: post_options, key: 'allow_comments' })
      console.log(id_temp_parse)
      ycore.sync.emmitPost(id_temp_parse)
      ycore.yconsole.log(`pro_boost => ${pro_boost_val} | allow_comments => ${allow_comments_val}`)

      if (pro_boost_val) {
        ycore.yconsole.log(`Boosting post with ID => ${id_temp_parse}`)
        ycore.comty_post.__boost(
          (err, res) => {
            return true
          },
          { post_id: id_temp_parse }
        )
      }
      if (
        !allow_comments_val
      ) {
        ycore.yconsole.log(`Disabling comments with ID => ${id_temp_parse}`)
        ycore.comty_post.__disableComments(
          (err, res) => {
            return true
          },
          { post_id: id_temp_parse }
        )
      }
      this.FlushPostState()
      // ycore.FeedHandler.addToRend(JSON.parse(res)['data'])
    }, payload)
  }
  dropRef = React.createRef()

  handleDragIn = e => {
    e.preventDefault()
    e.stopPropagation()
    if (this.state.uploader == true) {
      return
    }
    this.setState({ uploader: true })
  }
  handleDragOut = e => {
    e.preventDefault()
    e.stopPropagation()
    if (this.state.uploader == false) {
      return
    }
    this.setState({ uploader: false })
  }

  componentDidMount() {
    const _this = this
    $('body').bind('paste', function(je) {
      var e = je.originalEvent
      for (var i = 0; i < e.clipboardData.items.length; i++) {
        var item = e.clipboardData.items[i]
        ycore.yconsole.log('Item: ' + item.type)
        if (item.type.indexOf('image') != -1) {
          //item.
          let a;
          a = item.getAsFile()
          _this.setState({ file: a })
          ycore.ReadFileAsB64(a, res => {
            _this.setState({ fileURL: res })
          })
        } else {
          // ignore not images
          ycore.yconsole.log('Discarding not image paste data')
        }
      }
    })
    let div = this.dropRef.current
    div.addEventListener('dragenter', this.handleDragIn)
    div.addEventListener('dragleave', this.handleDragOut)
  }
  componentWillUnmount() {
    let div = this.dropRef.current
    div.removeEventListener('dragenter', this.handleDragIn)
    div.removeEventListener('dragleave', this.handleDragOut)
  }

  canPost() {
    const { fileURL, keys_remaining } = this.state

    const isTypedSomething = keys_remaining < ycore.AppSettings.MaxLengthPosts
    const isUploadedFile = fileURL ? true : false

    return isUploadedFile || isTypedSomething
  }

  render() {
    const { userData } = this.props
    const { keys_remaining, visible, fileURL } = this.state
    const percent = (
      (keys_remaining / ycore.AppSettings.MaxLengthPosts) *
      100
    ).toFixed(2)
    const changeShare = ({ key }) => {
      this.setState({ shareWith: key })
    }

    const shareOptionsMenu = (
      <antd.Menu onClick={changeShare}>
        <antd.Menu.Item key="any">
          {ycore.GetPostPrivacy.decorator('any')}
        </antd.Menu.Item>
        <antd.Menu.Item key="only_follow">
          {ycore.GetPostPrivacy.decorator('only_follow')}
        </antd.Menu.Item>
        <antd.Menu.Item key="only_followers">
          {ycore.GetPostPrivacy.decorator('only_followers')}
        </antd.Menu.Item>
        <antd.Menu.Item key="private">
          {ycore.GetPostPrivacy.decorator('private')}
        </antd.Menu.Item>
      </antd.Menu>
    )

    if (visible) {
      return (
        <div className={styles.cardWrapper}>
          <antd.Card bordered="false">
            <div ref={this.dropRef} className={styles.inputWrapper}>
              {this.state.uploader ? (
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
              ) : (
                <>
                  <div className={styles.titleAvatar}>
                    <img src={userData.avatar} />
                  </div>
                  <antd.Input.TextArea
                    disabled={this.state.posting ? true : false}
                    onPressEnter={this.handlePublishPost}
                    value={this.state.rawtext}
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    dragable="false"
                    placeholder="What are you thinking?"
                    onChange={this.handleChanges}
                    allowClear
                    maxLength={ycore.AppSettings.MaxLengthPosts}
                    rows={8}
                  />
                  <div>
                    <antd.Button
                      disabled={this.state.posting ? true : !this.canPost()}
                      onClick={this.handlePublishPost}
                      type="primary"
                      icon={
                        this.state.posting_ok ? (
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
              )}
            </div>
            <div className={styles.progressHandler}>
              <antd.Progress
                strokeWidth="4px"
                className={
                  this.state.posting
                    ? styles.proccessUnset
                    : keys_remaining < 512
                    ? styles.proccessSet
                    : styles.proccessUnset
                }
                status={this.handleKeysProgressBar()}
                showInfo={false}
                percent={percent}
              />
            </div>
            {fileURL ? this.renderPostPlayer(this.state.fileURL) : null}
            <div className={styles.postExtra}>
              <antd.Button
                styles={this.state.uploader ? { fontSize: '20px' } : null}
                type="ghost"
                onClick={() => this.ToogleUpload()}
              >
                {' '}
                {this.state.uploader ? (
                  <MICONS.Cancel />
                ) : (
                  <MICONS.AddCircle />
                )}{' '}
              </antd.Button>
              <antd.Button type="ghost" onClick={() => optionBox.toogle()}>
                <MICONS.Tune />
              </antd.Button>
              <antd.Dropdown overlay={shareOptionsMenu}>
                <a
                  className={styles.shareWith}
                  onClick={e => e.preventDefault()}
                >
                  {ycore.GetPostPrivacy.decorator(this.state.shareWith)}
                </a>
              </antd.Dropdown>
            </div>
          </antd.Card>
          <Post_options visible={this.state.toolbox_open} />
        </div>
      )
    }
    return null
  }
}
export default PostCreator
