import verbosity from 'core/libs/verbosity'
import * as Icons from 'components/Icons'
import styles from './index.less'
import ReactDOM from 'react-dom'
import * as antd from 'antd'
import React from 'react'

let onRend = false
const renderDiv = document.createElement('div')
export interface ContextMenuComponent_props {
    renderList: any;
    yPos: number;
    xPos: number;
    app: any;
    dispatch: any;
}

export class ContextMenuComponent extends React.PureComponent<ContextMenuComponent_props>{
    listening: boolean
    wrapperRef: any
    eventListener: () => void
    renderDiv: HTMLDivElement
    state: any
    
    constructor(props:any){
        super(props)
        this.state = {
            renderList: null,
            loading: true
        }

        this.renderDiv = renderDiv
        this.listening = false
        this.setWrapperRef = this.setWrapperRef.bind(this)
        this.handleClickOutside = this.handleClickOutside.bind(this)

        this.eventListener = () => {
            document.addEventListener('click', this.handleClickOutside, false)
            this.listening = true
        }
    }
    
    setWrapperRef(node){
        this.wrapperRef = node
    }

    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.listening = false
            DestroyContextMenu()
            document.removeEventListener('click', this.eventListener, false)
        }
    }

    filterArray(data: any[]) {
        let tmp: any = []
        return new Promise(resolve => {
          data.forEach(async (element: { require: string; }) => {
            if (typeof(element.require) !== 'undefined') {
              const validRequire = await window.requireQuery(element.require)
              validRequire? tmp.push(element) : null
            }else{
              tmp.push(element)
            }
          })
          resolve(tmp)
        })
    }

    async queryMenu(data){
        this.setState({ renderList: await this.filterArray(data), loading: false })
    }
    
    handle(e:any, props:any){
        if(!e || typeof(e) == 'undefined') {
          return false
        }
        typeof(e.onClick) !== 'undefined' && e.onClick ? e.onClick(props) : null
        typeof(e.keepOnClick) !== 'undefined' && e.keepOnClick ? null : DestroyContextMenu()
    }

    renderElements(){
        if (!Array.isArray(this.state.renderList)) {
            return null
        }
        return this.state.renderList.map((e:any) => {
            return(
                <div {...e.params.itemProps} onClick={() => this.handle(e.params, this.props)} key={e.key}>
                 {e.icon}{e.title}
              </div>
            )
        })
    }
    
    componentDidMount(){
        if (this.props.renderList) {
            this.queryMenu(this.props.renderList)
        }
    }

    componentDidUpdate(){
        !this.listening ? this.eventListener() : null
    }

    render(){
        if (this.state.loading) {
            return null
        }
        return ( 
            <div
              id="contextualMenu"
              ref={this.setWrapperRef}
              className={styles.contextualMenu}
              style={{
                  top: this.props.yPos,
                  left: this.props.xPos,
              }}>
                  {this.renderElements()}
            </div>
        )
    }
}

export function DestroyContextMenu(){
    verbosity('destroying')
    const unmountResult = ReactDOM.unmountComponentAtNode(renderDiv)
    if (unmountResult && renderDiv.parentNode) {
        renderDiv.parentNode.removeChild(renderDiv)
        onRend = false
    }
}

export function OpenContextMenu(props){
    verbosity([props])
    const renderComponent = React.createElement(ContextMenuComponent, props)
    if (onRend) {
        DestroyContextMenu()
    }
    document.body.appendChild(renderDiv).setAttribute('id', 'contextMenu')
    ReactDOM.render(renderComponent, renderDiv)
    onRend = true
}


export default OpenContextMenu
