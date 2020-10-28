import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import { connect } from 'umi'
import styles from '../../index.less'

import { theme, getOptimalOpacityFromIMG, get_style_rule_value } from 'core/libs/style'
import { urlToBase64, imageToBase64, arrayToObject } from 'core'
import ThemeConfigurator from '../../configurator'

@connect(({ app }) => ({ app }))
export default class BackgroundImage extends ThemeConfigurator {
    state = {
        configKey: "backgroundImage",
        model: { active: false, opacity: null, src: null },

        textColor: this.rgbToScheme(getComputedStyle(document.getElementById("appWrapper")).color),
        overlayColor: this.rgbToScheme(getComputedStyle(document.getElementById("appWrapper")).backgroundColor),

        processing: null,
        fileURL: null,
        customURL: '',
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

    handleCustomURL(url) {
        this.setState({ processing: true, fileURL: url })
        urlToBase64(url, fileURL => {
            this.proccessBackground(fileURL)
        })
    }

    proccessBackground(data) {
        getOptimalOpacityFromIMG({ textColor: this.state.textColor, overlayColor: this.state.overlayColor, img: data }, (res) => {
            this.handleUpdate({ active: true, src: this.state.fileURL, opacity: res })
        })
    }

    schemeToRGB(values) {
        const scheme = values ? values : { r: '0', g: '0', b: '0' }
        const r = scheme.r || '0'
        const g = scheme.g || '0'
        const b = scheme.b || '0'
        return `rgb(${r}, ${g}, ${b})`
    }

    rgbToScheme(rgb) {
        const values = rgb.replace(/[^\d,]/g, '').split(',');
        return { r: values[0], g: values[1], b: values[2] }
    }

    render() {
        const PreviewModel = () => {
            return (
                <div>
                    <h3><Icons.Layout /> Preview</h3>
                    { this.state.model.src ? <div className={styles.background_image_preview} style={{ backgroundColor: this.schemeToRGB(this.state.overlayColor) }}>
                        <div style={{ color: `${this.schemeToRGB(this.state.textColor)}!important` }} className={styles.text_wrapper}>
                            <h1 style={{ color: this.schemeToRGB(this.state.textColor) }}>Sample text</h1>
                            <h2 style={{ color: this.schemeToRGB(this.state.textColor) }}>Sample text</h2>
                            <h3 style={{ color: this.schemeToRGB(this.state.accentColor) }}>Sample text</h3>
                            <h4 style={{ color: this.schemeToRGB(this.state.accentColor) }}>Sample text</h4>
                            <p style={{ color: this.schemeToRGB(this.state.textColor) }}>Some text here</p>
                            <p style={{ color: this.schemeToRGB(this.state.accentColor) }}>Some text here</p>

                        </div>
                        <img style={{ opacity: this.state.model.opacity }} src={this.state.model.src} />
                    </div> : <h3 style={{ textAlign: 'center' }} > No Background </h3>}
                </div>
            )
        }

        return (
            <div>
                <div className={styles.background_image_controls} >
                    <div>
                        <h4><Icons.Eye />Enabled</h4>
                        <antd.Switch
                            checkedChildren="Enabled"
                            unCheckedChildren="Disabled"
                            loading={this.state.processing}
                            onChange={(e) => { this.promiseState(prevState => ({ model: { ...prevState.model, active: e } })).then(() => this.handleUpdate()) }}
                            checked={this.state.model.active}
                        />
                    </div>
                    <div>

                        <h4><Icons.Layers />Opacity</h4>
                        <antd.Slider disabled={!this.state.model.src} onChange={(e) => { this.setState(prevState => ({ model: { ...prevState.model, opacity: e / 100 } })) }} onAfterChange={() => this.handleUpdate()} value={this.state.model.opacity * 100} />
                    </div>
                    <div>
                        <h4><Icons.Code />Export Code</h4>
                        <antd.Button disabled={!this.state.model.src} size="small" onClick={() => this.handleExport()}> Export </antd.Button>
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
                            Upload from your files <br />
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

                    {this.state.processing ? <h4><Icons.LoadingOutlined spin /> Processing image ... </h4> : null}
                    {this.state.params ? JSON.stringify(this.state.params) : null}
                </div>

                <antd.Divider type="horizontal" dashed />


            </div>
        )
    }
}