import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'

export interface ContextMenu_props {
    visible: boolean;
    fragment: object;
    yPos: number;
    xPos: number;
    app: any;
    dispatch: any;
}

export default class ContextMenu extends React.Component<ContextMenu_props>{
    constructor(props){
        super(props)
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
        if ( this.props.visible && this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.listening = false
            window.contextMenu.toogle()
            document.removeEventListener('click', this.eventListener, false)
        }
    }

    componentDidUpdate(){
        !this.listening ? this.eventListener() : null
    }

    render(){
        if (this.props.visible) {
            return(
                <div
                  id="contextualMenu"
                  ref={this.setWrapperRef}
                  className={styles.contextualMenu}
                  style={{
                      top: this.props.yPos,
                      left: this.props.xPos,
                  }}>
                    {this.props.fragment}
                </div>
            )
        }
       return null
    }
}


ContextMenu.defaultProps = {
    visible: false,
    fragment: null,
    xPos: 0,
    yPos: 0
}

