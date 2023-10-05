import React from "react"
import { Modal as AntdModal } from "antd"
import classnames from "classnames"
import useLayoutInterface from "hooks/useLayoutInterface"
import { DOMWindow } from "components/RenderWindow"

import "./index.less"

class Modal extends React.Component {
    state = {
        visible: false,
    }

    contentRef = React.createRef()

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
        if (this.contentRef.current && !this.contentRef.current.contains(e.target)) {
            if (this.props.confirmOnOutsideClick) {
                return AntdModal.confirm({
                    title: this.props.confirmOnClickTitle ?? "Are you sure?",
                    content: this.props.confirmOnClickContent ?? "Are you sure you want to close this window?",
                    onOk: () => {
                        this.close()
                    }
                })
            }

            return this.close()
        }
    }

    render() {
        return <div
            className={classnames(
                "app_modal_wrapper",
                {
                    ["active"]: this.state.visible,
                    ["framed"]: this.props.framed,
                }
            )}
            onTouchEnd={this.handleClickOutside}
            onMouseDown={this.handleClickOutside}
        >
            <div
                className="app_modal_content"
                ref={this.contentRef}
                onTouchEnd={this.handleClickOutside}
                onMouseDown={this.handleClickOutside}
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
            framed = true,

            confirmOnOutsideClick = false,
            confirmOnClickTitle,
            confirmOnClickContent,

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
            framed={framed}
            confirmOnOutsideClick={confirmOnOutsideClick}
            confirmOnClickTitle={confirmOnClickTitle}
            confirmOnClickContent={confirmOnClickContent}
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