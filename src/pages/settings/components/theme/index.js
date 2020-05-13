import React from 'react'
import * as Feather from 'feather-reactjs'
import * as app from 'app'
import * as antd from 'antd'

import { SketchPicker } from 'react-color';

import ColorThief from 'colorthief/dist/color-thief'
var colorThief = new ColorThief();


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

class BackgroundImage extends React.Component{
    state = {
        results: []
    }

    search(key){
        if (!key) return false
        app.api_unsplash.search(key, (res) =>{
            console.log(res)
            this.setState({ results: res })
        })
    }
    returnString(url){
        this.props.selectImg(`url(${url})`)
    }
    render(){
        return (
        <>
            <h3> <Feather.Image /> Upload </h3>
            <antd.Divider type="horizontal" dashed />

            <h3> Unsplash </h3>
            <antd.Input.Search onSearch={value => this.search(value)} />
            <antd.List itemLayout="vertical" dataSource={this.state.results} renderItem={item => ( <antd.List.Item> <img onClick={() => this.returnString(item.urls.full)} src={item.urls.small} /> </antd.List.Item>) }/>
        </>
        )
    }
}

export default class ThemeSettings extends React.PureComponent{
    state = {
        helper_visible: false,
        helper_fragment: null,
        style: [],
    }

    componentDidMount(){
        this.decodeData()
    }

    decodeData(){
        const storaged = app.app_theme.getString()
        try {
            if (storaged) {
               this.decode(storaged, (res) => {
                    this.setState({ style: res })
               })
            }
        } catch (error) {
            console.log(error)
        }
    }

    encode(data, callback){
        if (!data) return false
        try {
            let mix = []
            const obj = Object.entries(data)
            obj.forEach((e) => {
                mix.push({key: e[0], value: e[1]})
            })
            return callback(JSON.stringify(mix))
        } catch (error) {
            console.log(error)
            return false
        }
    }
    decode(data, callback){
        if (!data) return false
        try {
            const scheme = JSON.parse(data)
            let mix = {};
            scheme.forEach((e)=>{
                mix[e.key] = e.value
            })
            return callback(mix)
        } catch (error) {
            console.log(error)
            return false
        }
    }

    handleChanges(key, value){
        let { style } = this.state
        try {
            switch (key) {
                case "backgroundImage":{
                    if(style.backgroundColor){
                        this.handleRemove("backgroudColor")
                    }
                    style[key] = value
                    this.encode(style, (res) => {
                        app.app_theme.set(res)
                        this.setPredominantColor(value)
                    })
                    return true
                }
                case "backgroundColor":{
                    if(style.backgroundImage){
                        this.handleRemove("backgroundImage")
                    }
                    style[key] = value
                    this.encode(style, (res) => {
                        app.app_theme.set(res)
                        this.handleChanges("predominantColor", value)
                    })
                }
                default:{
                    style[key] = value
                    this.encode(style, (res) => {
                        app.app_theme.set(res)
                    })
                }
            }
            this.decodeData()
        } catch (error) {
            console.log(error)
        }
    }

    resetStyles(){
        app.app_theme.set([])
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

    setPredominantColor(furl){
        const _this = this
        const img = new Image();
        const url = ((furl.replace("url", "")).substring(1)).slice(0, -1);

        img.crossOrigin = 'Anonymous';
        img.src = url
        
        img.addEventListener('load', function() {
          const color = `rgb(${colorThief.getColor(img)})`
          _this.handleChanges("predominantColor", color)
        })
        
    }

    helper = {
        open: (e) => {
            this.setState({ helper_visible: true, helper_fragment: e })
        },
        close: () => {
            this.setState({ helper_visible: false, helper_fragment: null })
        },
        backgroundImage: () => {
            this.helper.open(<BackgroundImage selectImg={(i) => this.handleChanges("backgroundImage", i)} />)
        },
        backgroundColor: () => {
            this.helper.open(<BackgroundColor changeColor={(i) => this.handleChanges("backgroundColor", i)} />)
        }
    }
    render(){
        return(
            <div>
                <h2><Feather.Layers/> Theme</h2>
                <div>
                    <button onClick={() => this.helper.backgroundImage()}> Background Image</button>
                    <button onClick={() => this.helper.backgroundColor()}> Background Color </button>
                    <button onClick={() => this.resetStyles()}> Reset Style </button>
                </div>
                <antd.Drawer
                    title="Theme Settings"
                    placement="right"
                    width="500"
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