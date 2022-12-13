import React from "react"
import * as antd from "antd"


const EndpointRequester = (props) => {
    const { endpoint, method, request } = props

    const [bodyParams, setBodyParams] = React.useState([])
    const [queryParams, setQueryParams] = React.useState([])

    const [loading, setLoading] = React.useState(false)
    const [response, setResponse] = React.useState(null)

    const [form] = antd.Form.useForm()

    const handleRequest = async () => {
        setLoading(true)

        const values = form.getFieldsValue()

        console.log(values)

        return
        const response = await request()

        setResponse(response)
        setLoading(false)
    }


    return <div>
        <antd.Form
            form={form}
        >
            <antd.Form.List name="bodyPayload">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, payloadKey: name, ...restField }) => (
                            <antd.Space
                                key={key}
                                style={{
                                    display: "flex",
                                    marginBottom: 8,
                                }}
                                align="baseline"
                            >
                                <antd.Form.Item
                                    {...restField}
                                    name={[name, "key"]}
                                    rules={[
                                        {
                                            required: true,
                                            message: "Missing body key",
                                        },
                                    ]}
                                >
                                    <antd.Input placeholder="Key" />
                                </antd.Form.Item>
                                <antd.Form.Item
                                    {...restField}
                                    name={[name, "value"]}
                                    rules={[
                                        {
                                            required: true,
                                            message: "Missing value",
                                        },
                                    ]}
                                >
                                    <antd.Input placeholder="Value" />
                                </antd.Form.Item>
                                <antd.Button onClick={() => remove(name)}>
                                    Remove
                                </antd.Button>
                            </antd.Space>
                        ))}
                        <antd.Form.Item>
                            <antd.Button type="dashed" onClick={() => add()} block>
                                Add field
                            </antd.Button>
                        </antd.Form.Item>
                    </>
                )}
            </antd.Form.List>
        </antd.Form>

        <antd.Button
            loading={loading}
            onClick={handleRequest}
        >
            Request
        </antd.Button>

        <div>
            Response:
            <pre>
                {JSON.stringify(response, null, 2)}
            </pre>
        </div>
    </div>

}

export default () => {
    const [loading, setLoading] = React.useState(true)
    const [activeKey, setActiveKey] = React.useState("0")

    const [apiNamespacesKeys, setApiNamespacesKeys] = React.useState([])

    const loadData = () => {
        const apiNamespaces = app.api.namespaces

        setApiNamespacesKeys(Object.keys(apiNamespaces))

        setLoading(false)
    }

    const generateEndpointsMapTabs = (apiNamespaceKey) => {
        const endpoints = app.api.namespaces[apiNamespaceKey].endpoints

        return Object.keys(endpoints).map((method, index) => {
            return <antd.Tabs
                tabPosition="left"
                destroyInactiveTabPane
            >
                {
                    Object.keys(endpoints[method]).map((endpoint, index) => {
                        return <antd.Tabs.TabPane tab={endpoint} key={index}>
                            <EndpointRequester
                                endpoint={endpoint}
                                method={method}
                                request={endpoints[method][endpoint]}
                            />
                        </antd.Tabs.TabPane>
                    })
                }
            </antd.Tabs>
        })
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return <div>
            loading api namespaces...
        </div>
    }

    return <div>
        <antd.Tabs
            tabPosition="top"
            destroyInactiveTabPane
        >
            {
                apiNamespacesKeys.map((key, index) => {
                    return <antd.Tabs.TabPane tab={key} key={index}>
                        {
                            generateEndpointsMapTabs(key)
                        }
                    </antd.Tabs.TabPane>
                })
            }
        </antd.Tabs>
    </div>
}