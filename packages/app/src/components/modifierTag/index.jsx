import React from "react"
import * as antd from "antd"
import { Icons, createIconRender } from "components/Icons"

export default (props) => {
    const [loading, setLoading] = React.useState(false)
    const [options, setOptions] = React.useState([])
    const [value, setValue] = React.useState(null)

    const onChangeProperties = async (update) => {
        if (props.eventDisable) {
            return false
        }

        setLoading(true)

        await props.onChangeProperties(update)
            .then((data) => {
                return setValue(update.join("-"))
            })
            .catch((error) => {
                return
            })

        setLoading(false)
    }

    const getTagColor = () => {
        if (props.colors) {
            return props.colors[value]
        }

        return "default"
    }

    const handleOptionsLoad = async (fn) => {
        setLoading(true)

        const result = await fn()
        setOptions(result)

        setLoading(false)
    }

    const handleDefaultValueLoad = async (fn) => {
        const result = await fn()
        setValue(result)
    }

    React.useEffect(() => {
        if (typeof props.options === "function") {
            handleOptionsLoad(props.options)
        } else {
            setOptions(props.options)
        }

        if (typeof props.defaultValue === "function") {
            handleDefaultValueLoad(props.defaultValue)
        } else {
            setValue(props.defaultValue)
        }
    }, [])

    return <antd.Cascader options={options} onChange={(update) => onChangeProperties(update)} >
        <antd.Tag color={getTagColor()}>
            {loading ? <Icons.LoadingOutlined spin /> :
                <>
                    {Icons[props.icon] && createIconRender(props.icon)}
                    <h4>
                        {value}
                    </h4>
                </>
            }
        </antd.Tag>
    </antd.Cascader>
}