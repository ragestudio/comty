import React from "react"
import { Modal, Button } from "antd"
import { Icons } from "components/Icons"

import "./index.less"

export default class AppModal extends React.Component {
    constructor(props) {
        super(props)

        this.controller = app.ModalController = {
            open: this.open,
            close: this.close,
            modalRef: this.modalRef,
        }
    }

    state = {
        currentRender: null,
        renderParams: {}
    }

    modalRef = React.createRef()

    open = (render, params = {}) => {
        this.setState({
            currentRender: render,
            renderParams: params
        })
    }

    close = () => {
        this.setState({
            currentRender: null,
            renderParams: {}
        })
    }

    handleModalClose = () => {
        this.close()
    }

    renderModal = () => {
        return <div className="appModalWrapper">
            <Button
                icon={<Icons.X />}
                className="closeButton"
                onClick={this.handleModalClose}
                shape="circle"
            />

            <div className="appModal" ref={this.modalRef}>
                {React.createElement(this.state.currentRender, {
                    ...this.state.renderParams.props ?? {},
                    close: this.close,
                })}
            </div>
        </div>
    }

    render() {
        return <Modal
            open={this.state.currentRender}
            maskClosable={this.state.renderParams.maskClosable ?? true}
            modalRender={this.renderModal}
            maskStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(5px)"
            }}
            destroyOnClose
            centered
        />
    }
}