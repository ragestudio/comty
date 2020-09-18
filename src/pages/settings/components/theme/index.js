import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import {connect} from 'umi'
import styles from './index.less'

import { onError } from 'core/libs/errorhandler'
import { theme, getOptimalOpacityFromIMG, get_style_rule_value } from 'core/libs/style' 
import { urlToBase64, imageToBase64, arrayToObject } from 'core'
import exportDataAsFile from 'core/libs/interface/export_data'
import ThemeSettingsList from 'globals/theme_settings.js'

class ThemeConfigurator extends React.Component{
       
    componentDidMount(){
        this.applyStoraged()
    }
    
    applyStoraged(){
        const storaged = theme.get()
        if(storaged && this.state){
            storaged[this.state.key]? this.setState({ model: storaged[this.state.key]}) : onError.internal_proccess(`"Config key" or "Dispatcher" is missing`)
        }
    }

    promiseState = async state => new Promise(resolve => this.setState(state, resolve));

    handleUpdate(payload){
        if(!this.state.key || !this.props.dispatch) {
            return onError.internal_proccess(`"Config key" or "App/Dispatcher" is missing`)
        }
        if (!payload) {
            payload = this.state.model
        }
        this.setState({ model: payload, processing: false })
        this.props.dispatch({
            type: 'app/updateTheme',
            payload: { 
                key: this.state.key,
                value: payload
            }
        });
    }

    handleErase(){
       this.handleUpdate({})
    }

    handleExport(){
        exportDataAsFile({data: JSON.stringify(this.state.model), type: 'text/json'})
    }
    
}

@connect(({ app }) => ({ app }))
class DarkMode extends ThemeConfigurator{
    constructor(props){
        super(props),
        this.state = {
            key: "darkmode",
            model: { active: false }
        }

    }
    render(){
        return <>
            <div>
                <h2><Icons.Moon /> Dark Mode</h2>
            </div>
            <div>
            <div className={styles.background_image_controls} >
                <div>
                    <h4><Icons.Eye />Enabled</h4>
                    <antd.Switch 
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        onChange={(e) => {this.promiseState(prevState => ({ model: { ...prevState.model, active: e }})).then(() => this.handleUpdate())}}
                        checked={this.state.model.active}
                    />
                </div>
            </div>

            </div>

         </>
    }
}

@connect(({ app }) => ({ app }))
class Colors extends ThemeConfigurator{
    constructor(props){
        super(props),
        this.state = {
            key: "darkmode",
            model: { active: false }
        }

    }
    render(){
        return <>
            <div>
                <h2><Icons.Moon /> Dark Mode</h2>
            </div>
            <div>
            <div className={styles.background_image_controls} >
                <div>
                    <h4><Icons.Eye />Enabled</h4>
                    <antd.Switch 
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        onChange={(e) => {this.promiseState(prevState => ({ model: { ...prevState.model, active: e }})).then(() => this.handleUpdate())}}
                        checked={this.state.model.active}
                    />
                </div>
            </div>

            </div>

         </>
    }
}

@connect(({ app }) => ({ app }))
class BackgroundImage extends ThemeConfigurator{
    constructor(props){
        super(props),
        this.state = {
            key: "backgroundImage",
            model: { active: false, opacity: null, src: null },
    
            textColor: this.rgbToScheme(getComputedStyle(document.getElementById("appWrapper")).color),
            overlayColor: this.rgbToScheme(getComputedStyle(document.getElementById("appWrapper")).backgroundColor),
    
            processing: null,
            customURL: '',
            fileURL: null,
        }
    }

    handleFileUpload = info => {
      if (info.file.status === 'uploading') {
          return this.setState({ processing: false })
      }
      if (info.file.status === 'done') {
        this.setState({ processing: true })
          imageToBase64(info.file.originFileObj, fileURL => {
            this.setState({ fileURL: fileURL })
            this.proccessBackground(fileURL)
          })
      }
    }

    handleCustomURL(url){
        this.setState({ processing: true, fileURL: url })
        urlToBase64(url, fileURL => {
            this.proccessBackground(fileURL)
        })
    }

    proccessBackground(data){
        getOptimalOpacityFromIMG({textColor: this.state.textColor, overlayColor: this.state.overlayColor, img: data}, (res) => {
            this.handleUpdate({active: true, src: this.state.fileURL, opacity: res})
        })
    }

    schemeToRGB(values){
        const scheme = values? values : { r: '0', g: '0', b: '0' }
        const r = scheme.r || '0'
        const g = scheme.g || '0'
        const b = scheme.b || '0'
        return `rgb(${r}, ${g}, ${b})`
    }
    
    rgbToScheme(rgb){
        const values = rgb.replace(/[^\d,]/g, '').split(',');
        return {r: values[0], g: values[1], b: values[2]}
    }

    render(){
        const PreviewModel = () => {
          return(
            <div>
                <h3><Icons.Layout /> Preview</h3>
                { this.state.model.src? <div className={styles.background_image_preview} style={{ backgroundColor: this.schemeToRGB(this.state.overlayColor) }}>
                    <div style={{ color: `${this.schemeToRGB(this.state.textColor)}!important` }} className={styles.text_wrapper}>
                        <h1 style={{ color: this.schemeToRGB(this.state.textColor) }}>Sample text</h1>
                        <h2 style={{ color: this.schemeToRGB(this.state.textColor) }}>Sample text</h2>
                        <h3 style={{ color: this.schemeToRGB(this.state.accentColor) }}>Sample text</h3>
                        <h4 style={{ color: this.schemeToRGB(this.state.accentColor) }}>Sample text</h4>
                        <p style={{ color: this.schemeToRGB(this.state.textColor) }}>Some text here</p>
                        <p style={{ color: this.schemeToRGB(this.state.accentColor) }}>Some text here</p>

                    </div>
                    <img style={{ opacity: this.state.model.opacity }} src={this.state.model.src} />
                </div> : <h3 style={{ textAlign: 'center' }} > No Background </h3> }
            </div>
          )
        }
        
        return (
        <>
            <div>
                <h2><Icons.Image/> Background Image</h2>
            </div>
            <antd.Divider type="horizontal" dashed />
            <div className={styles.background_image_controls} >
                <div>
                    <h4><Icons.Eye />Enabled</h4>
                    <antd.Switch 
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        loading={this.state.processing}
                        onChange={(e) => {this.promiseState(prevState => ({ model: { ...prevState.model, active: e }})).then(() => this.handleUpdate())}}
                        checked={this.state.model.active}
                    />
                </div>
                <div>
       
                    <h4><Icons.Layers />Opacity</h4>
                    <antd.Slider disabled={!this.state.model.src} onChange={(e) => {this.setState(prevState => ({model: {...prevState.model, opacity: e/100}}))}} onAfterChange={() => this.handleUpdate()} value={this.state.model.opacity*100} />
                </div>
                <div>
                    <h4><Icons.Code />Export Code</h4>
                    <antd.Button disabled={!this.state.model.src}  size="small" onClick={() => this.handleExport()}> Export </antd.Button>
                </div>
                <div>
                    <h4><Icons.Copy />Import Code</h4>
                    <antd.Button size="small" onClick={() => null}> Import </antd.Button>
                </div>
                <div>
                    <h4><Icons.Trash />Erase</h4>
                    <antd.Popconfirm disabled={!this.state.model.src} placement="topLeft" title="Are you sure?" onConfirm={() => this.handleErase()} okText="Yes" cancelText="No">
                        <antd.Button disabled={!this.state.model.src} size="small" type="primary" danger > Delete </antd.Button>
                    </antd.Popconfirm>
                </div>
            
            </div>

            <antd.Divider type="horizontal" dashed />
                <PreviewModel />
            <antd.Divider type="horizontal" dashed />


            <div>
                <h3><Icons.Upload /> Upload </h3>
                <div className={styles.background_image_uploader} >
                    <div>
                        Upload from your files <br/>
                        <antd.Upload onChange={this.handleFileUpload}>
                            <antd.Button icon={<Icons.Upload type="primary" style={{ margin: '5px 0 0 0' }} />} />
                        </antd.Upload>
                    </div>
                    <div>
                        <h3>Or</h3>
                    </div>
                    <div>
                        Upload from URL
                        <antd.Input onPressEnter={() => this.handleCustomURL(this.state.customURL)} onChange={e => this.setState({ customURL: e.target.value })} value={this.state.customURL} placeholder="http://example.com/my_coolest_image.jpg" />
                    </div>
                </div>

                {this.state.processing? <h4><Icons.LoadingOutlined spin /> Processing image ... </h4> : null}
                {this.state.params? JSON.stringify(this.state.params) : null}
            </div>

            <antd.Divider type="horizontal" dashed />

            {/* <h3><Icons.Unsplash style={{ marginRight: "10px", verticalAlign: "-0.125em", width: "1em", height: "1em" }} /> Unsplash </h3>
            <antd.Input.Search onSearch={value => this.search(value)} />
            <antd.List itemLayout="vertical" dataSource={this.state.results} renderItem={item => ( <antd.List.Item> <img onClick={() => this.returnString(item.urls.full)} src={item.urls.small} /> </antd.List.Item>) }/> */}
        </>
        )
    }
}

@connect(({ app }) => ({ app }))
export default class ThemeSettings extends React.Component{
    state = {
        helper_fragment: null
    }

    render(){
        const idToComponent = {
            backgroundImage: <BackgroundImage />,
            darkmode: <DarkMode />,
            color: <Colors />,
        }
        const handleClick = (key) => key? this.setState({helper_fragment: idToComponent[key]}) : null
        const isActive = (key) => { return key? key.active : false }
        return(
            <div>
                <h2><Icons.Layers/> Theme</h2>
                <antd.List
                  itemLayout="horizontal"
                  dataSource={ThemeSettingsList}
                  renderItem={item => (
                     <div style={{ margin: '10px 0 10px 0' }} >
                        <antd.Card size="small" bodyStyle={{ width: '100%' }} style={{ display: "flex", flexDirection: "row", margin: 'auto', borderRadius: '12px' }} hoverable onClick={() => handleClick(item.id)}>
                            <h3>{item.icon}{item.title} <div style={{ float: "right" }}><antd.Tag color={isActive(arrayToObject(this.props.app.app_theme)[item.id])? "green" : "default"} > {isActive(arrayToObject(this.props.app.app_theme)[item.id])? "Enabled" : "Disabled"} </antd.Tag></div></h3>
                            <p>{item.description}</p>
                        </antd.Card>
                     </div>
                  )}
                />
                
                <antd.Drawer
                    placement="right"
                    width="700px"
                    closable={true}
                    onClose={() => this.setState({ helper_fragment: null })}
                    visible={this.state.helper_fragment? true : false}
                >
                    <React.Fragment> 
                        {this.state.helper_fragment}
                    </React.Fragment>
                </antd.Drawer>

            </div>
        )
    }
}