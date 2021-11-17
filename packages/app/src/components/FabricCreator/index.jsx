import React from 'react'
import * as antd from 'antd'
import { Icons as FIcons, createIconRender } from "components/Icons"
import * as MDIcons from "react-icons/md"

const Icons = {
    ...FIcons,
    ...MDIcons
}

import "./index.less"

const FormComponents = {
    "input": antd.Input,
    "textarea": antd.Input.TextArea,
    "select": antd.Select,
}

// FIELDS
const FieldsForms = {
    description: {
        label: "Description",
        component: "input",
        updateEvent: "onChange",
        onUpdate: (update) => {
            return update.target.value
        },
        style: {
            minWidth: "300px",
        },
        props: {
            placeholder: "Describe something...",
        }
    },
    operations: {
        label: "Operations",
        component: "input",
        updateEvent: "onChange",
        onUpdate: (update) => {
            return update.target.value
        },
    },
    vaultItemTypeSelector: {
        label: "Type",
        component: "select",
        updateEvent: "onChange",
        props: {
            placeholder: "Select a type",
            children: [
                <antd.Select.OptGroup label="Computers">
                    <antd.Select.Option value="computers-desktop">Desktop</antd.Select.Option>
                    <antd.Select.Option value="computers-laptop">Laptop</antd.Select.Option>
                    <antd.Select.Option value="computers-phone">Phone</antd.Select.Option>
                    <antd.Select.Option value="computers-tablet">Tablet</antd.Select.Option>
                    <antd.Select.Option value="computers-other">Other</antd.Select.Option>
                </antd.Select.OptGroup>,
                <antd.Select.OptGroup label="Peripherals">
                    <antd.Select.Option value="peripherals-monitor">Monitor</antd.Select.Option>
                    <antd.Select.Option value="peripherals-printer">Printer</antd.Select.Option>
                </antd.Select.OptGroup>,
            ]
        }
    },
}

//FORMULAS
const ProductFormula = {
    defaultFields: [
        "description",
        "operations",
    ]
}

const OperationFormula = {
    defaultFields: [
        "description",
        "task",
    ]
}

const PhaseFormula = {
    defaultFields: [
        "description",
        "task",
    ]
}

const TaskFormula = {
    defaultFields: [
        "description",
        "tasks",
    ]
}

const VaultItemFormula = {
    defaultFields: [
        "vaultItemTypeSelector",
    ]
}

const FORMULAS = {
    product: ProductFormula,
    operation: OperationFormula,
    phase: PhaseFormula,
    task: TaskFormula,
    vaultItem: VaultItemFormula,
}

// TYPES
const FabricItemTypesIcons = {
    "product": "Box",
    "operation": "Settings",
    "phase": "GitCommit",
    "task": "Tool",
    "vaultItem": "Archive",
}

const FabricItemTypes = ["product", "operation", "phase", "task", "vaultItem"]

export default class FabricCreator extends React.Component {
    state = {
        loading: true,
        values: {},

        fields: [],

        name: null,
        type: null,
        uuid: null,
    }

    componentDidMount = async () => {
        await this.setItemType("product")
        this.setState({ loading: false })
    }

    clearValues = async () => {
        await this.setState({ values: {} })
    }

    clearFields = async () => {
        await this.setState({ fields: [] })
    }

    setItemType = async (type) => {
        const formulaKeys = Object.keys(FORMULAS)

        if (formulaKeys.includes(type)) {
            const formula = FORMULAS[type]

            await this.clearValues()
            await this.clearFields()

            formula.defaultFields.forEach(field => {
                this.appendFieldByType(field)
            })

            this.setState({ type: type, name: "New item" })
        } else {
            console.error(`Cannot load default fields from formula with type ${type}`)
        }
    }

    appendFieldByType = (fieldType) => {
        const form = FieldsForms[fieldType]

        if (typeof form === "undefined") {
            console.error(`No form available for field [${fieldType}]`)
            return null
        }

        const fields = this.state.fields
        fields.push(this.generateFieldRender({ type: fieldType, ...form }))

        this.setState({ fields: fields })
    }

    renderFieldSelectorMenu = () => {
        return <antd.Menu
            onClick={(e) => {
                this.appendFieldByType(e.key)
            }}
        >
            {Object.keys(FieldsForms).map((field) => {
                const form = FieldsForms[field]
                const icon = form.icon && createIconRender(form.icon)

                return <antd.Menu.Item key={field}>
                    {icon ?? null}
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                </antd.Menu.Item>
            })}
        </antd.Menu>
    }

    renderTypeMenuSelector = () => {
        return <antd.Menu
            onClick={(e) => {
                this.setItemType(e.key)
            }}
        >
            {FabricItemTypes.map((type) => {
                const TypeIcon = FabricItemTypesIcons[type] && createIconRender(FabricItemTypesIcons[type])

                return <antd.Menu.Item key={type}>
                    {TypeIcon ?? null}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </antd.Menu.Item>
            })}
        </antd.Menu>
    }

    onDone = () => {
        console.log(this.getValues())
    }

    onUpdateValue = (event, value) => {
        const { updateEvent, key } = event

        let state = this.state
        state.values[key] = value

        this.setState(state)
    }

    removeField = (key) => {
        this.setState({ fields: this.state.fields.filter(field => field.key != key) })
    }

    getValues = () => {
        return this.state.fields.map((field) => {
            return {
                type: field.props.type,
                value: this.state.values[field.key],
            }
        })
    }

    generateFieldRender = (field) => {
        let { key, style, type, icon, component, label, updateEvent, props, onUpdate } = field

        if (!key) {
            key = this.state.fields.length
        }

        if (typeof FormComponents[component] === "undefined") {
            console.error(`No component type available for field [${key}]`)
            return null
        }

        return <div key={key} id={`${type}-${key}`} type={type} className="field" style={style}>
            <div className="close" onClick={() => { this.removeField(key) }}><Icons.X /></div>
            <h4>{icon && createIconRender(icon)}{label}</h4>
            <div className="fieldContent">
                {React.createElement(FormComponents[component], {
                    ...props,
                    value: this.state.values[key],
                    [updateEvent]: (...args) => {
                        if (typeof onUpdate === "function") {
                            return this.onUpdateValue({ updateEvent, key }, onUpdate(...args))
                        }
                        return this.onUpdateValue({ updateEvent, key }, ...args)
                    },
                })}
            </div>

        </div>
    }

    render() {
        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        const TypeIcon = FabricItemTypesIcons[this.state.type] && createIconRender(FabricItemTypesIcons[this.state.type])

        return <div className="fabric_creator">
            <div key="name" className="name">
                <div className="type">
                    <antd.Dropdown trigger={['click']} overlay={this.renderTypeMenuSelector}>
                        {TypeIcon ?? <Icons.HelpCircle />}
                    </antd.Dropdown>
                </div>
                <antd.Input defaultValue={this.state.name} />
            </div>
            <div className="fields">
                <div className="wrap">
                    {this.state.fields}
                </div>
                <div className="bottom_actions">
                    <antd.Dropdown trigger={['click']} placement="topCenter" overlay={this.renderFieldSelectorMenu}>
                        <Icons.Plus />
                    </antd.Dropdown>
                    <antd.Button onClick={this.onDone}>Done</antd.Button>
                </div>
            </div>
        </div>
    }
}