import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import themeSettings from 'globals/theme_settings'
import {connect} from 'umi'
import styles from './index.less'
import json_prune from 'core/libs/json_prune'


import { SketchPicker } from 'react-color';
import { theme, getOptimalOpacityFromIMG, get_style_rule_value } from 'core/libs/style' 


function getBase64(img, callback) {
    const reader = new FileReader()
    reader.addEventListener('load', () => callback(reader.result))
    reader.readAsDataURL(img)
}

function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

class BackgroundColor extends React.Component{
    state = {
        selected: "#fff"
    }
    sendChanges(){
        this.props.changeColor(this.state.selected)
    }
    selectColor = (color) =>{
        this.setState({selected: color.hex})
    }
    render(){
        return <>
            <SketchPicker
              color={this.state.selected}
              onChangeComplete={this.selectColor}
            />
            <antd.Button onClick={() => this.sendChanges()}> Change </antd.Button>
        </>
    }
}

@connect(({ app }) => ({ app }))
class BackgroundImage extends React.Component{
    state = {
        customURL: '',
        fileURL: null,
        processing: null,
        model: { active: false, opacity: null, src: null }
    }

    handleFileUpload = info => {
      if (info.file.status === 'uploading') {
          return this.setState({ processing: false })
      }
      if (info.file.status === 'done') {
        this.setState({ processing: true })
          getBase64(info.file.originFileObj, fileURL => {
            this.setState({ fileURL: fileURL })
            this.proccessBackground(fileURL)
          })
      }
    }

    handleCustomURL(url){
        this.setState({ processing: true })
        this.setState({ fileURL: url })

        toDataUrl(url, fileURL => {
            this.proccessBackground(fileURL)
        })
    }

    handleUpdate(payload){
        if (!payload) {
            payload = this.state.model
        }
        this.setState({ model: payload, processing: false })
        this.props.dispatch({
            type: 'app/updateTheme',
            payload: { backgroundImage: payload }
        });
    }

    handleErase(){
        this.handleUpdate({})
    }

    handleExport(){
        const string = JSON.stringify(this.state.model)
        const exportCodeRender = () => {
            if(string.length > 500){
                return <div style={{ textAlign: 'center', width: '100%', padding: '30px 0 30px 0' }}>
                    <Icons.HardDrive style={{ fontSize: '45px', margin: '0' }} />
                    <h4>Hey, this file is too much large!</h4>
                    <span>So it couldn't be displayed.</span>
                </div>
            }
            return <div>
                {string}
            </div>
        }
        antd.Modal.confirm({
            title: <div><Icons.Code /> Your export <antd.Tag> JSON </antd.Tag></div>,
            icon: null,
            onOk: () => {
                let tmp = document.createElement('a')
                tmp.href = `data:text/json;charset=utf-8,${encodeURIComponent(string)}`
                tmp.download="export.json"
                tmp.click()
            },
            okText: <><Icons.Download />Download as File</> ,
            cancelText: "Done",
            content: exportCodeRender(),
        });
 
     
    }

    proccessBackground(data){
        getOptimalOpacityFromIMG({textColor: this.state.textColor, overlayColor: this.state.overlayColor, img: data}, (res) => {
            this.handleUpdate({active: true, src: this.state.fileURL, opacity: res})
        })
    }

    schemeToRGB(values){
        const scheme = values || { r: '0', g: '0', b: '0' }
        const r = scheme.r || '0'
        const g = scheme.g || '0'
        const b = scheme.b || '0'
        return `rgb(${r}, ${g}, ${b})`
    }
    
    rgbToScheme(rgb){
        const values = rgb.replace(/[^\d,]/g, '').split(',');
        return {r: values[0], g: values[1], b: values[2]}
    }
    
    componentDidMount(){
        const storaged = theme.get()["backgroundImage"]
        if(storaged){
            this.setState({ model: storaged })
        }

        let textColor =  this.rgbToScheme(get_style_rule_value('#root', 'color'))
        let overlayColor = this.rgbToScheme(get_style_rule_value('#root', 'backgroundColor'))

        this.setState({
            textColor: textColor, 
            overlayColor: overlayColor
        })
    }


    render(){
        const promiseState = async state => new Promise(resolve => this.setState(state, resolve));

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
                        onChange={(e) => {
                            promiseState(prevState => ({ model: { ...prevState.model, active: e }})).then(() => this.handleUpdate())
                        }}
                        checked={this.state.model.active}
                    />
                </div>
                <div>
       
                    <h4><Icons.Layers />Opacity</h4>
                    <antd.Slider disabled={!this.state.model.src} onChange={(e) => {
                        this.setState(
                            prevState => ({
                                model: {                  
                                    ...prevState.model,
                                    opacity: e/100
                                }
                            })
                        )
                    }} onAfterChange={() => this.handleUpdate()} value={this.state.model.opacity*100} />
                </div>
                <div>
                    <h4><Icons.Code />Export Code</h4>
                    <antd.Button disabled={!this.state.model.src}  size="small" onClick={() => this.handleExport()}> Export </antd.Button>
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

export default class ThemeSettings extends React.PureComponent{
    state = {
        helper_visible: false,
        helper_fragment: null,
        style: theme.get(),
    }


    handleRemove(key){
        try {
            const storaged = JSON.parse(app.app_theme.getString())
            let mix = {};
            storaged.forEach((e)=>{
                return e.key !== key? mix[e.key] = e.value : null
            })
            console.log(mix)
            this.encode(mix, (res)=> {
                app.app_theme.set(res)
                this.decodeData()
            })
        } catch (error) {
            console.log(error)
            return false
        }

    }

    helper = {
        open: (e) => {
            this.setState({ helper_visible: true, helper_fragment: e })
        },
        close: () => {
            this.setState({ helper_visible: false, helper_fragment: null })
        },
        backgroundImage: () => {
            this.helper.open(<BackgroundImage />)
        },
        backgroundColor: () => {
            this.helper.open(<BackgroundColor />)
        }
    }


    render(){
        const settingClick = { backgroundImage: () => this.helper.backgroundImage(), backgroundColor: () => this.helper.backgroundColor() }
        return(
            <div>
                <h2><Icons.Layers/> Theme</h2>
                <antd.List
                  itemLayout="horizontal"
                  dataSource={themeSettings}
                  renderItem={item => (
                        <antd.Card size="small" bodyStyle={{ width: '100%' }} style={{ display: "flex", flexDirection: "row", margin: 'auto' }} hoverable onClick={settingClick[item.id]}>
                            <h3>{item.icon}{item.title} <div style={{ float: "right" }}><antd.Tag color={this.state.style[item.id]? "green" : "default"} > {this.state.style[item.id]? "Enabled" : "Disabled"} </antd.Tag></div></h3>
                            <p>{item.description}</p>
                        </antd.Card>
                  )}
                />
                
                <antd.Drawer
                    placement="right"
                    width="600px"
                    closable={true}
                    onClose={this.helper.close}
                    visible={this.state.helper_visible}
                >
                    <React.Fragment> 
                        {this.state.helper_fragment}
                    </React.Fragment>
                </antd.Drawer>

            </div>
        )
    }
}