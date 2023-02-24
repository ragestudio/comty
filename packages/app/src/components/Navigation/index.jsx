import React from "react"
import { Translation } from "react-i18next"

import Items from "schemas/sidebar"
import { Icons, createIconRender } from "components/Icons"

import "./index.less"

export default class NavigationMenu extends React.Component {
    onClick = (id) => {
        window.app.setLocation(`/${id}`)
        this.props.close()
    }

    generateMenus = (items) => {
        // group items it has children to a new array and the rest to a general array
        items = items.reduce((acc, item) => {
            if (item.children) {
                acc.push(item)
            } else {
                acc[0].children.push(item)
            }

            return acc
        }, [{
            id: "general",
            title: "General",
            icon: "Home",
            children: []
        }])

        return items.map((group) => {
            return <div key={group.id} className="group">
                <h2>
                    {Icons[group.icon] && createIconRender(group.icon)}
                    <Translation>
                        {(t) => t(group.title)}
                    </Translation>
                </h2>
                <div className="items">
                    {
                        group.children.map((item) => {
                            return this.renderItem(item)
                        })
                    }
                </div>
            </div>
        })
    }

    renderItem = (item, index) => {
        return <div
            key={item.id}
            id={item.id}
            onClick={() => this.onClick(item.id)}
            className="item"
        >
            <div className="icon">
                {Icons[item.icon] && createIconRender(item.icon)}
            </div>
            <div className="name">
                <h1>
                    <Translation>
                        {(t) => t(item.title ?? item.id)}
                    </Translation>
                </h1>
            </div>
        </div>
    }

    render() {
        return <div className="navigation">
            {this.generateMenus(Items)}
        </div>
    }
}