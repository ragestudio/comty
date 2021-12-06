import React from 'react'
import * as antd from 'antd'
import { Icons as FIcons, createIconRender } from "components/Icons"
import * as MDIcons from "react-icons/md"
import loadable from "@loadable/component"

import "./index.less"

const Icons = {
    ...FIcons,
    ...MDIcons
}

const FormComponents = {
    "input": antd.Input,
    "textarea": antd.Input.TextArea,
    "select": antd.Select,
    "datepicker": antd.DatePicker,
}

const requestModifyByType = {
    "vaultItem": {
        "additions": ["essc"]
    }
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
    location: {
        label: "Location",
        component: "select",
        updateEvent: "onChange",
        children: async () => {
            const api = window.app.request
            const regions = await api.get.regions()

            return regions.map(region => {
                return <antd.Select.Option value={region.name}>{region.name}</antd.Select.Option>
            })
        },
        props: {
            placeholder: "Select a location",
        }
    },
    vaultItemTypeSelector: {
        label: "Type",
        component: "select",
        updateEvent: "onChange",
        children: async () => {
            let types = await import("schemas/vaultItemsTypes.json")

            types = types.default || types

            return Object.keys(types).map((group) => {
                return <antd.Select.OptGroup key={group} label={String(group).toTitleCase()}>
                    {types[group].map((type) => {
                        return <antd.Select.Option key={type} value={`${group}-${type}`}>{String(type).toTitleCase()}</antd.Select.Option>
                    })}
                </antd.Select.OptGroup>
            })
        },
        props: {
            placeholder: "Select a type",
        }
    },
    vaultItemSerial: {
        label: "Serial number",
        component: "input",
        updateEvent: "onChange",
        onUpdate: (update) => {
            return update.target.value
        },
        props: {
            placeholder: "S/N 00000000X",
        }
    },
    vaultItemManufacturer: {
        label: "Manufacturer",
        component: "input",
        updateEvent: "onChange",
        onUpdate: (update) => {
            return update.target.value
        },
        props: {
            placeholder: "e.g. Hewlett Packard",
        }
    },
    vaultItemManufacturedYear: {
        label: "Manufactured Year",
        component: "datepicker",
        updateEvent: "onChange",
        onUpdate: (update) => {
            return update.year()
        },
        props: {
            picker: "year"
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
        // TODO: include location
        "vaultItemTypeSelector",
        "vaultItemSerial",
        "vaultItemManufacturer",
        "vaultItemManufacturedYear",
        "location",
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
        submitting: false,
        error: null,

        name: null,
        type: null,
        fields: [],
        values: {},
    }

    componentDidMount = async () => {
        await this.setItemType(this.props.defaultType ?? "product")
        this.setState({ loading: false })
    }

    toogleLoading = (to) => {
        this.setState({ loading: to ?? !this.state.loading })
    }

    toogleSubmitting = (to) => {
        this.setState({ submitting: to ?? !this.state.submitting })
    }

    clearError = () => {
        if (this.state.error != null) {
            this.setState({ error: null })
        }
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

            await this.setState({ type: type, name: "New item" })
        } else {
            console.error(`Cannot load default fields from formula with type ${type}`)
        }
    }

    appendFieldByType = (fieldType) => {
        const field = FieldsForms[fieldType]

        if (typeof field === "undefined") {
            console.error(`No form available for field [${fieldType}]`)
            return null
        }

        const fields = this.state.fields

        if (this.fieldsHasTypeKey(fieldType) && !field.allowMultiple) {
            console.error(`Field [${fieldType}] already exists, and only can exists 1`)
            return false
        }

        fields.push(this.generateFieldRender({ type: fieldType, ...field }))

        this.setState({ fields: fields })
    }

    fieldsHasTypeKey = (key) => {
        let isOnFields = false

        const fields = this.state.fields

        fields.forEach(field => {
            field.props.type === key ? isOnFields = true : null
        })

        return isOnFields
    }

    renderFieldSelectorMenu = () => {
        return <antd.Menu
            onClick={(e) => {
                this.appendFieldByType(e.key)
            }}
        >
            {Object.keys(FieldsForms).map((key) => {
                const field = FieldsForms[key]
                const icon = field.icon && createIconRender(field.icon)
                const disabled = this.fieldsHasTypeKey(key) && !field.allowMultiple

                return <antd.Menu.Item disabled={disabled} key={key}>
                    {icon ?? null}
                    {key.charAt(0).toUpperCase() + key.slice(1)}
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

    onDone = async () => {
        this.clearError()
        this.toogleSubmitting(true)

        const api = window.app.request
        let properties = {}

        this.getProperties().forEach((property) => {
            if (typeof properties[property.type] !== "undefined") {
                return properties[property.id] = property.value
            }

            return properties[property.type] = property.value
        })

        let payload = {
            type: this.state.type,
            name: this.state.name,
            properties: properties,
        }

        if (typeof requestModifyByType[this.state.type] !== "undefined") {
            payload = {
                ...payload,
                ...requestModifyByType[this.state.type],
            }
        }

        await api.put.fabric(payload).catch((response) => {
            console.error(response)
            this.setState({ error: response })

            return null
        })

        this.toogleSubmitting(false)

        if (!this.state.error && typeof this.props.close === "function") {
            this.props.close()
        }
    }

    onChangeName = (event) => {
        this.setState({ name: event.target.value })
    }

    onUpdateValue = (event, value) => {
        const { updateEvent, key } = event

        let state = this.state
        state.values[key] = value

        this.setState(state)
    }

    removeField = (key) => {
        let values = this.state.values
        let fields = this.state.fields.filter(field => field.key != key)

        delete values[key]

        this.setState({ fields: fields, values: values })
    }

    getProperties = () => {
        return this.state.fields.map((field) => {
            return {
                type: field.props.type,
                id: field.props.id,
                value: this.state.values[field.key],
            }
        })
    }

    getKeyFromLatestFieldType = (type) => {
        let latestByType = 0

        this.state.fields.forEach((field) => {
            field.props.type === type ? latestByType++ : null
        })

        return `${type}-${latestByType}`
    }

    generateFieldRender = (field) => {
        if (!field.key) {
            field.key = this.getKeyFromLatestFieldType(field.type)
        }

        if (typeof FormComponents[field.component] === "undefined") {
            console.error(`No component type available for field [${field.key}]`)
            return null
        }

        const getSubmittingState = () => {
            return this.state.submitting
        }

        let fieldComponentProps = {
            ...field.props,
            value: this.state.values[field.key],
            disabled: getSubmittingState(),
            [field.updateEvent]: (...args) => {
                if (typeof field.onUpdate === "function") {
                    return this.onUpdateValue({ updateEvent: field.updateEvent, key: field.key }, field.onUpdate(...args))
                }
                return this.onUpdateValue({ updateEvent: field.updateEvent, key: field.key }, ...args)
            },
        }

        let RenderComponent = null

        if (typeof field.children === "function") {
            RenderComponent = loadable(async () => {
                try {
                    const children = await field.children()
                    return () => React.createElement(FormComponents[field.component], fieldComponentProps, children)
                } catch (error) {
                    console.log(error)
                    return ()=> <div>
                        <Icons.XCircle /> Load Error
                    </div>
                }
            }, {
                fallback: <div>Loading...</div>,
            })
        } else {
            RenderComponent = () => React.createElement(FormComponents[field.component], fieldComponentProps)
        }

        return <div key={field.key} id={`${field.type}-${field.key}`} type={field.type} className="field" style={field.style}>
            <div className="close" onClick={() => { this.removeField(field.key) }}><Icons.X /></div>
            <h4>{field.icon && createIconRender(field.icon)}{field.label}</h4>
            <div className="fieldContent">
                <RenderComponent />
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
                <antd.Input defaultValue={this.state.name} onChange={this.onChangeName} />
            </div>

            <div className="fields">
                <div className="wrap">
                    {this.state.submitting ? <antd.Skeleton active /> : this.state.fields}
                </div>
                <div className="bottom_actions">
                    <antd.Dropdown trigger={['click']} placement="topCenter" overlay={this.renderFieldSelectorMenu}>
                        <Icons.Plus />
                    </antd.Dropdown>

                    <antd.Button loading={this.state.submitting} onClick={this.onDone}>Done</antd.Button>
                </div>
                {this.state.error && <div className="error">
                    {this.state.error}
                </div>}
            </div>
        </div>
    }
}
