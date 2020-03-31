import React from 'react'
import * as Icons from '@ant-design/icons'

export default class MediaPlayer extends React.PureComponent {
  render() {
    const { file } = this.props
    let type;
  
    const ImageExtensions = ['.png', '.jpg', '.jpeg', '.gif']
    const VideoExtensions = ['.mp4', '.mov', '.avi']
    const AudioExtensions = ['.mp3', '.ogg', '.wav']

    const FilesAllowed = ImageExtensions.concat(VideoExtensions, AudioExtensions)
    
    for (const prop in FilesAllowed) {
     if(file.includes(`${ImageExtensions[prop]}`)){
      type = 'image'
     }
     if(file.includes(`${VideoExtensions[prop]}`)){
      type = 'video'
     }
     if(file.includes(`${AudioExtensions[prop]}`)){
      type = 'audio'
     }
    } 

    if (type == 'video') {
      //  const payload = {type: 'video', sources: [{src: file,}]}
      //  return (
      //    <PlyrComponent styles={{ width: '100%' }} sources={payload} />
      //  )
      return (
        <video id="player" playsInline controls>
          <source src={file} />
        </video>
      )
    }
    if (type == 'audio') {
      return (
        <audio id="player" controls>
          <source src={file} />
        </audio>
      )
    }
    if (type == 'image') {
      if (file.includes('gif')) {
        return <div><Icons.GifOutlined /> <img src={file} /></div>
      }
     return <img src={file} />
    } 
    return null
  }
}
