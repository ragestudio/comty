import React from "react"
import classnames from "classnames"
import useLayoutInterface from "hooks/useLayoutInterface"
import { DOMWindow } from "components/RenderWindow"

import "./index.less"

class Modal extends React.Component {
    state = {
        visible: false,
    }

    escTimeout = null

    componentDidMount() {
        setTimeout(() => {
            this.setState({
                visible: true,
            })
        }, 10)

        document.addEventListener("keydown", this.handleEsc, false)
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleEsc, false)
    }

    close = () => {
        this.setState({
            visible: false,
        })

        setTimeout(() => {
            if (typeof this.props.onClose === "function") {
                this.props.onClose()
            }
        }, 250)
    }

    handleEsc = (e) => {
        if (e.key === "Escape") {
            if (this.escTimeout !== null) {
                clearTimeout(this.escTimeout)
                return this.close()
            }

            this.escTimeout = setTimeout(() => {
                this.escTimeout = null
            }, 250)
        }
    }

    handleClickOutside = (e) => {
        if (e.target === e.currentTarget) {
            this.close()
        }
    }

    render() {
        return <div
            className={classnames(
                "app_modal_wrapper",
                {
                    ["active"]: this.state.visible
                }
            )}
            onClick={this.handleClickOutside}
        >
            <div
                className="app_modal_content"
                onClick={this.handleClickOutside}
            >
                {
                    React.cloneElement(this.props.children, {
                        close: this.close
                    })
                }
            </div>
        </div>
    }
}

export default () => {
    const modalRef = React.useRef()

    function openModal(
        id,
        render,
        {
            className,
            props,
        } = {}
    ) {
        const win = new DOMWindow({
            id: id,
            className: className,
        })

        win.render(<Modal
            ref={modalRef}
            win={win}
            onClose={() => {
                win.destroy()
            }}
        >
            {
                React.createElement(render, props)
            }
        </Modal>)
    }

    function closeModal() {
        modalRef.current.close()
    }

    useLayoutInterface("modal", {
        open: openModal,
        close: closeModal,
    })

    return null
}