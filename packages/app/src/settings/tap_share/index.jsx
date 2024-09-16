import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import NFCModel from "comty.js/models/nfc"

import { Icons } from "@components/Icons"
import UserShareBadge from "@components/UserShareBadge"

import CheckRegister from "./steps/check_register"
import DataEditor from "./steps/data_editor"
import TagWritter from "./steps/tag_writter"
import Success from "./steps/success"

import StepsContext from "./context"

import "./index.less"

const RegisterNewTagSteps = [
    CheckRegister,
    DataEditor,
    TagWritter,
    Success,
]

const RegisterNewTag = (props) => {
    const [step, setStep] = React.useState(0)
    const [stepsValues, setStepsValues] = React.useState({
        ...props.tagData ?? {}
    })

    const nextStep = () => {
        setStep((step) => step + 1)
    }

    const prevStep = () => {
        setStep((step) => step - 1)
    }

    const finish = () => {
        if (typeof props.onFinish === "function") {
            props.onFinish()
        }

        if (typeof props.close === "function") {
            props.close()
        }
    }

    // create a react context for the steps
    const StepsContextValue = {
        next: nextStep,
        prev: prevStep,
        values: stepsValues,
        setValue: (key, value) => {
            setStepsValues((stepsValues) => {
                return {
                    ...stepsValues,
                    [key]: value
                }
            })
        },
        onFinish: finish,
        nfcReader: app.cores.nfc.instance(),
        close: props.close
    }

    if (props.tagData) {
        return <div className="tap-share-register">
            <div className="tap-share-register-content">
                <StepsContext.Provider value={StepsContextValue}>
                    <DataEditor
                        onFinish={finish}
                    />
                </StepsContext.Provider>
            </div>
        </div>
    }

    if (app.cores.nfc.incompatible) {
        return <antd.Result
            status="error"
            title="Error"
            subTitle="Your device doesn't support NFC."
        />
    }

    return <div
        className={classnames(
            "tap-share-register",
            {
                ["compact"]: step > 0
            }
        )}
    >
        <div className="tap-share-register-header">
            <antd.Button
                type="link"
                onClick={prevStep}
                disabled={step === 0}
                icon={<Icons.MdChevronLeft />}
                className={classnames(
                    "tap-share-register-header-back",
                    {
                        ["hidden"]: step === 0
                    }
                )}
            />

            <div className="tap-share-register-header-icon">
                <Icons.MdNfc />
            </div>

            <h1>
                Register new tag
            </h1>
        </div>

        <div className="tap-share-register-content">
            <StepsContext.Provider value={StepsContextValue}>
                {
                    React.createElement(RegisterNewTagSteps[step])
                }
            </StepsContext.Provider>
        </div>
    </div>
}

const TagItem = (props) => {
    return <div
        key={props.tag.serialNumber}
        id={props.tag.serialNumber}
        className="tap-share-own_tags-item"
    >
        <div className="tap-share-own_tags-item-icon">
            <Icons.MdNfc />
        </div>

        <div className="tap-share-own_tags-item-title">
            <h4>
                {props.tag.alias}
            </h4>

            <span>
                {props.tag.serial}
            </span>
        </div>

        <div className="tap-share-own_tags-item-actions">
            <antd.Button
                icon={<Icons.MdEdit />}
                onClick={props.onEdit}
            />
            <antd.Button
                icon={<Icons.MdDelete />}
                danger
                onClick={props.onDelete}
            />
        </div>
    </div>
}

class OwnTags extends React.Component {
    state = {
        loading: true,
        error: null,
        data: null,
        editorOpen: false,
    }

    loadData = async () => {
        this.setState({
            loading: true,
        })

        const result = await NFCModel.getOwnTags()
            .catch((err) => {
                console.error(err)
                this.setState({
                    error: err.message,
                    loading: false,
                    data: null
                })
                return false
            })

        if (!result) {
            return false
        }

        this.setState({
            loading: false,
            data: result,
            error: null
        })
    }

    handleOpenEditor = (props) => {
        this.setState({
            editorOpen: true
        })

        OpenTagEditor({
            ...props,
            onFinish: () => {
                this.setState({
                    editorOpen: false
                })

                this.loadData()
            }
        })
    }

    handleTagDelete = (tag) => {
        antd.Modal.confirm({
            title: "Are you sure you want to delete this tag?",
            content: `This action cannot be undone.`,
            onOk: async () => {
                NFCModel.deleteTag(tag._id)
                    .then(() => {
                        app.message.success("Tag deleted")
                        this.loadData()
                    })
                    .catch((err) => {
                        console.error(err)
                        app.message.error(err.message)
                        return false
                    })
            }
        })
    }

    handleTagRead = async (error, tag) => {
        if (this.state.editorOpen) {
            return false
        }

        if (error) {
            console.error(error)
            return false
        }

        const ownedTag = this.state.data.find((ownedTag) => {
            return ownedTag.serial === tag.serialNumber
        })

        if (!ownedTag) {
            app.message.error("This tag is not registered or you don't have permission to edit it.")
            return false
        }

        return this.handleOpenEditor({
            tag: ownedTag
        })
    }

    componentDidMount = async () => {
        await this.loadData()

        app.cores.nfc.subscribe(this.handleTagRead)
    }

    componentWillUnmount = () => {
        app.cores.nfc.unsubscribe(this.handleTagRead)
    }

    render() {
        console.log(this.state)
        if (this.state.loading) {
            return <div className="tap-share-own_tags">
                <antd.Skeleton />
            </div>
        }

        if (!this.state.data) {
            return <antd.Empty
                description="You don't have any tags yet."
            />
        }

        return <div className="tap-share-own_tags">
            {
                this.state.data.length === 0 && <antd.Empty
                    description="You don't have any tags yet."
                />
            }

            {
                this.state.data.length > 0 && this.state.data.map((tag) => {
                    return <TagItem
                        key={tag.serialNumber}
                        tag={tag}
                        onEdit={() => {
                            this.handleOpenEditor({
                                tag: tag
                            })
                        }}
                        onDelete={() => {
                            this.handleTagDelete(tag)
                        }}
                    />
                })
            }

            {
                app.isMobile && <antd.Button
                    type="primary"
                    icon={<Icons.FiPlus />}
                    onClick={() => this.handleOpenEditor({})}
                    className="tap-share-own_tags-add"
                >
                    Add new
                </antd.Button>
            }
        </div>
    }
}

const OpenTagEditor = ({ tag, onFinish = () => app.navigation.softReload() } = {}) => {
    if (!app.layout.draggable) {
        return app.layout.drawer.open("tag_register", RegisterNewTag, {
            props: {
                onFinish: onFinish,
                tagData: tag,
            }
        })
    }

    return app.layout.draggable.open("tag_register", RegisterNewTag, {
        componentProps: {
            onFinish: onFinish,
            tagData: tag,
        }
    })
}

const TapShareRender = () => {
    return <div className="tap-share-render">
        {
            !app.cores.nfc.scanning && app.isMobile && <antd.Alert
                type="warning"
                message="NFC is disabled"
                description="You can enable it in your device settings."
            />
        }

        <div className="tap-share-field">
            <div className="tap-share-field_header">
                <h1>
                    <Icons.MdSpoke /> Registered Tags
                </h1>
            </div>

            {
                app.cores.nfc.scanning && <span className="tip">
                    <Icons.MdInfo /> You can quickly edit your tags by tapping them.
                </span>
            }

            <OwnTags />
        </div>

        <div className="tap-share-field">
            <div className="tap-share-field_header">
                <h1>
                    <Icons.MdBadge /> Your Badge
                </h1>
            </div>

            <UserShareBadge
                user={app.userData}
                editMode
            />
        </div>
    </div>
}

export default {
    id: "tap_share",
    icon: "MdNfc",
    label: "Tap Share",
    group: "app",
    render: TapShareRender
}