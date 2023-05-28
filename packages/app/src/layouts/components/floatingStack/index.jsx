import React from "react"
import classnames from "classnames"
import { DOMWindow } from "components/RenderWindow"

import "./index.less"

class FloatingStackItem extends React.PureComponent {
    state = {
        renderError: null
    }

    componentDidCatch(error, info) {
        console.log(error, info)

        this.setState({
            renderError: error,
        })
    }

    render() {
        if (this.state.renderError) {
            return <div className="floating_stack_item">
                <h1>Render Error</h1>
            </div>
        }

        return <div className="floating_stack_item" key={this.props.id} id={this.props.id}>
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        </div>
    }
}

export default class FloatingStack extends React.Component {
    state = {
        renders: [],
        globalVisibility: true,
    }

    public = {
        add: (id, render) => {
            try {
                if (!id) {
                    console.error(`FloatingStack: id is required`)
                    return false
                }
                if (!render) {
                    console.error(`FloatingStack: render is required`)
                    return false
                }

                if (this.state.renders.find((item) => item.id === id)) {
                    console.error(`FloatingStack: id ${id} already exists`)
                    return false
                }

                this.setState({
                    renders: [
                        ...this.state.renders,
                        {
                            id,
                            render: React.createElement(render),
                        },
                    ]
                })

                return render
            } catch (error) {
                console.log(error)
                return null
            }
        },
        remove: (id) => {
            this.setState({
                renders: this.state.renders.filter((item) => {
                    return item.id !== id
                })
            })

            return true
        },
        toogleGlobalVisibility: (to) => {
            if (typeof to !== "boolean") {
                to = !this.state.globalVisibility
            }

            this.setState({
                globalVisibility: to,
            })
        }
    }

    componentDidMount() {
        window.app.layout.floatingStack = this.public
    }

    componentWillUnmount() {
        window.app.layout.floatingStack = null
        delete window.app.layout.floatingStack
    }

    render() {
        return <div
            className={classnames(
                "floating_stack",
                {
                    ["hidden"]: !this.state.globalVisibility,
                }
            )}
        >
            {
                this.state.renders.map((item) => {
                    return <FloatingStackItem id={item.id}>
                        {item.render}
                    </FloatingStackItem>
                })
            }
        </div>
    }
}

export const createWithDom = () => {
    const dom = new DOMWindow({
        id: "FloatingStack",
    })

    dom.render(<FloatingStack />)

    return dom
}