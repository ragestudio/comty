import React from 'react'
import * as antd from 'antd'
import * as themeLIB from 'core/libs/style'

function getBase64(img, callback) {
    const reader = new FileReader()
    reader.addEventListener('load', () => callback(reader.result))
    reader.readAsDataURL(img)
  }
  
export default class themedebug extends React.PureComponent {
    state = {
        textColor: {r: '255', g: '255', b: '255'}, 
        overlayColor: {r: '0', g: '0', b: '0'},

        optimal: null,
        file: null,
        fileURL: null,
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

    handleGetOptimal() {
        const optimal = themeLIB.getOptimalOpacityFromIMG({ textColor: this.state.textColor, overlayColor: this.state.overlayColor, img: this.state.fileURL })
        this.setState({ optimal: optimal })
    }

    schemeToRGB(values) {
        return `rgb(${values.r}, ${values.g}, ${values.b})`
    }
    
    render(){

        return(
            <div style={{ wordBreak: 'keep-all' }}>
                <antd.Button onClick={() => this.handleGetOptimal()}> Get OPACITY </antd.Button>
                <antd.Upload
                    multiple="false"
                    onChange={this.handleFileUpload}
                  >
                    <antd.Button>
                    Click to Upload
                    </antd.Button>
                  </antd.Upload>
                <div>
                    {JSON.stringify(this.state.file)}<br/><br/>
                    textColor:{JSON.stringify(this.state.textColor)}<br/><br/>
                    overlayColor:{JSON.stringify(this.state.overlayColor)}<br/><br/>

                </div>
            
    
                    <div style={{  position: 'absolute', backgroundColor: this.schemeToRGB(this.state.overlayColor) , display: 'flex', width: '500px', height: '500px' }}>
                        <h2 style={{ position: 'absolute', zIndex: '10', color: this.schemeToRGB(this.state.textColor) }}>Sample text</h2>
                        <img style={{ position: 'absolute',opacity: this.state.optimal,  zIndex: '9', width: '500px' }} src={this.state.fileURL} />
                    </div>
              

               
            </div>
        )
    }
} 