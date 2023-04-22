import React from "react"
import { Icons, createIconRender } from "components/Icons"
import { Button, Empty, Input, Select } from "antd"
import userLinksDecorators from "schemas/userLinksDecorators"

import "./index.less"

export default class ProfileEditor extends React.Component {
    state = {
        fields: this.props.ctx.currentValue ?? []
    }

    onDebounceSave = (value) => {
        this.setState({
            fields: value
        })
    }

    add = () => {
        this.setState({
            fields: [
                ...this.state.fields,
                {
                    key: undefined,
                    value: undefined
                }
            ]
        }, () => {
            this.props.ctx.onUpdateItem(this.state.fields)
        })
    }

    remove = (index) => {
        let fields = this.state.fields

        fields.splice(index, 1)

        this.setState({
            fields
        }, () => {
            this.props.ctx.onUpdateItem(this.state.fields)
        })
    }

    handleFieldChange = (index, key, value) => {
        let fields = this.state.fields

        fields[index][key] = value

        this.setState({
            fields
        }, () => {
            this.props.ctx.onUpdateItem(this.state.fields)
        })
    }

    render() {
        return <div className="profile_links_editor">
            {
                this.state.fields.length === 0 && <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No Links Added"
                />
            }
            {
                this.state.fields.length > 0 && this.state.fields.map((field, index) => {
                    return <div
                        key={index}
                        className="profile_links_field"
                    >
                        <div className="profile_links_field_input">
                            <p> <Icons.MdLabelOutline /> Key</p>

                            <Select
                                value={field.key}
                                onChange={(value) => this.handleFieldChange(index, "key", value)}
                                placeholder="Select a key"
                            >
                                {
                                    Object.entries(userLinksDecorators).map(([key, value]) => {
                                        return <Select.Option
                                            key={key}
                                            value={key}
                                        >
                                            {createIconRender(value.icon)}
                                            {String(key).toTitleCase()}
                                        </Select.Option>
                                    })
                                }
                            </Select>
                        </div>

                        <div className="profile_links_field_input">
                            <p> <Icons.MdLink /> Value</p>

                            <Input
                                value={field.value}
                                onChange={(e) => this.handleFieldChange(index, "value", e.target.value)}
                                placeholder="Link or Value e.g. https://twitter.com/username"
                            />
                        </div>

                        <Button
                            className="profile_links_field_removebtn"
                            onClick={() => this.remove(index)}
                            icon={<Icons.Trash />}
                            shape="circle"
                        />
                    </div>
                })
            }

            <Button
                onClick={this.add}
                icon={<Icons.Plus />}
            >
                Add
            </Button>
        </div>
    }
}

const basura = (props) => {
    const [fields, setFields] = React.useState([])

    const handleAdd = () => {
        setFields((prev) => {
            const newFields = prev ?? []

            newFields.push({
                key: undefined,
                value: undefined
            })

            //props.ctx.onUpdateItem(newFields)

            return newFields
        })
    }

    const handleRemove = (index) => {
        setFields((prev) => {
            const newFields = prev ?? []

            newFields.splice(index, 1)

            //props.ctx.onUpdateItem(newFields)

            return newFields
        })
    }

    const handleFieldChange = (index, key, value) => {
        setFields((prev) => {
            const newFields = prev ?? []

            newFields[index][key] = value

            //props.ctx.onUpdateItem(newFields)

            return newFields
        })
    }

    // React.useEffect(() => {

    //     setFields(props.ctx.currentValue)
    // }, [props.ctx.currentValue])

    console.log(`Render ProfileLinksEditor with >`, fields)


}