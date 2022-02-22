import React from "react"
import PropTypes from "prop-types"
import { cursorPosition } from "utils"
import { Container, Delete, Content } from "./styles"

class SwipeToDelete extends React.Component {
    state = {
        touching: null,
        translate: 0,
        deleting: false,
    }

    componentDidMount() {
        // to get ref dimensions
        this.forceUpdate()
    }

    onMouseDown = (e) => {
        if (this.props.disabled) return
        if (this.state.touching) return

        this.startTouchPosition = cursorPosition(e)
        this.initTranslate = this.state.translate

        this.setState({ touching: true }, () => {
            this.addEventListenerToMoveAndUp()
        })
    }

    addEventListenerToMoveAndUp = (remove = false) => {
        if (remove) {
            window.removeEventListener("mousemove", this.onMouseMove)
            window.removeEventListener("touchmove", this.onMouseMove)
            window.removeEventListener("mouseup", this.onMouseUp)
            window.removeEventListener("touchend", this.onMouseUp)
        } else {
            window.addEventListener("mousemove", this.onMouseMove)
            window.addEventListener("touchmove", this.onMouseMove)
            window.addEventListener("mouseup", this.onMouseUp)
            window.addEventListener("touchend", this.onMouseUp)
        }
    }

    onMouseMove = (e) => {
        const { rtl } = this.props

        if (!this.state.touching) {
            return cursorPosition(e)
        }

        if (
            (!rtl && cursorPosition(e) > this.startTouchPosition - this.initTranslate)
            || (rtl && cursorPosition(e) < this.startTouchPosition - this.initTranslate)
        ) {
            this.setState({ translate: 0 })
            return
        }

        this.setState({ translate: cursorPosition(e) - this.startTouchPosition + this.initTranslate })
    }

    onMouseUp = () => {
        this.startTouchPosition = null

        const { deleteWidth, rtl } = this.props
        const newState = {
            touching: false
        }

        const acceptableMove = -deleteWidth * 0.7
        const showDelete = (rtl ? -1 : 1) * this.state.translate < acceptableMove
        const notShowDelete = (rtl ? -1 : 1) * this.state.translate >= acceptableMove
        const deleteWithoutConfirm = (rtl ? 1 : -1) * this.state.translate >= this.deleteWithoutConfirmThreshold

        if (deleteWithoutConfirm) {
            newState.translate = -this.containerWidth
        }
        if (notShowDelete) {
            newState.translate = 0
        }
        if (showDelete && !deleteWithoutConfirm) {
            newState.translate = (rtl ? 1 : -1) * deleteWidth
        }

        this.setState(newState, () => {
            if (deleteWithoutConfirm) {
                this.onDeleteClick()
            }
        })

        this.addEventListenerToMoveAndUp(true)
    }

    onDeleteClick = () => {
        const { transitionDuration, onDelete } = this.props

        this.setState({ deleting: true }, () => {
            window.setTimeout(() => {
                onDelete()
            }, transitionDuration)
        })
    }

    componentWillUnmount() {
        this.addEventListenerToMoveAndUp(true)
    }

    render() {
        const { translate, touching, deleting } = this.state
        const { deleteWidth, transitionDuration, deleteText, deleteComponent, deleteColor, height, rtl } = this.props

        const cssParams = { deleteWidth, transitionDuration, deleteColor, heightProp: height, rtl }
        const shiftDelete = -translate >= this.deleteWithoutConfirmThreshold

        return (
            <Container
                ignore-dragger
                id="delete-container"
                deleting={deleting}
                {...cssParams}
                ref={c => {
                    if (c) {
                        this.container = c
                        this.containerWidth = c.getBoundingClientRect().width
                        this.deleteWithoutConfirmThreshold = this.containerWidth * 0.75
                    }
                }}
            >
                <Delete
                    ignore-dragger
                    id="delete"
                    buttonMargin={shiftDelete ? this.containerWidth + translate : this.containerWidth - deleteWidth}
                    {...cssParams}
                >
                    <button id="delete-button" onClick={this.onDeleteClick}>{deleteComponent ? deleteComponent : deleteText}</button>
                </Delete>
                <Content
                    {...cssParams}
                    ignore-dragger
                    id="delete-content"
                    deleting={deleting}
                    onMouseDown={this.onMouseDown}
                    onTouchStart={this.onMouseDown}
                    translate={translate}
                    transition={!touching}

                >
                    {this.props.children}
                </Content>
            </Container>
        )
    }
}

SwipeToDelete.propTypes = {
    onDelete: PropTypes.func.isRequired,
    height: PropTypes.number.isRequired,
    transitionDuration: PropTypes.number,
    deleteWidth: PropTypes.number,
    deleteColor: PropTypes.string,
    deleteText: PropTypes.string,
    deleteComponent: PropTypes.node,
    disabled: PropTypes.bool,
    rtl: PropTypes.bool,
}

SwipeToDelete.defaultProps = {
    transitionDuration: 250,
    deleteWidth: 75,
    deleteColor: "rgba(252, 58, 48, 1.00)",
    deleteText: "Delete",
    disabled: false,
    rtl: false,
}

export default SwipeToDelete