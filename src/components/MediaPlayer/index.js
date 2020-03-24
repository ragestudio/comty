import React from 'react'
import styles from './index.less'

export default class MediaPlayer extends React.PureComponent {
  renderPostPlayer(payload) {
    const ident = payload
    if (ident.includes('.mp4')) {
      return (
        <video id="player" playsInline controls>
          <source src={`${payload}`} type="video/mp4" />
        </video>
      )
    }
    if (ident.includes('.webm')) {
      return (
        <video id="player" playsInline controls>
          <source src={payload} type="video/webm" />
        </video>
      )
    }
    if (ident.includes('.mp3')) {
      return (
        <audio id="player" controls>
          <source src={payload} type="audio/mp3" />
        </audio>
      )
    }
    if (ident.includes('.ogg')) {
      return (
        <audio id="player" controls>
          <source src={payload} type="audio/ogg" />
        </audio>
      )
    } else {
      return <img src={payload} />
    }
  }
  render() {
    const { file } = this.props
    return (
      <div className={styles.PlayerContainer}>
        {this.renderPostPlayer(file)}
      </div>
    )
  }
}
