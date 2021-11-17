import React from 'react'
import * as antd from 'antd'
import { Icons } from 'components/Icons'
import { FormattedMessage } from 'react-intl'

export default class ButtonMenu extends React.Component {
    handleClickMenu(id) {
        const element = document.getElementById(id)
        if (typeof (element) !== "undefined") {
            try {
                element.focus()
            } catch (error) {
                console.log(error)
            }
        }
        if (typeof (this.props.onClick) !== "undefined") {
            this.props.onClick(id)
        }
    }

    renderMenus() {
        return this.props?.menus?.map((e) => {
            return <antd.Button onClick={() => this.handleClickMenu(e.id)} id={e.id ?? Math.random} key={e.id} className={window.classToStyle("indexMenuItem")}>
                <div className="icon">{e.icon ? React.createElement(Icons[e.icon], { style: e.iconStyle ?? null }) : null}</div>
                <div className="title"><FormattedMessage id={e.title} defaultMessage={e.title} /></div>
            </antd.Button>
        })
    }

    render() {
        return (
            <div className={window.classToStyle("indexMenu")} >
                {this.renderMenus()}
            </div>
        )
    }
}