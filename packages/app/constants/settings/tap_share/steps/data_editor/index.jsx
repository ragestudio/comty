import React from "react"
import * as antd from "antd"
import { Input } from "antd-mobile"
import { Icons } from "components/Icons"

import NFCModel from "comty.js/models/nfc"

import StepsContext from "../../context"

export default (props) => {
    const context = React.useContext(StepsContext)

    if (!context.values.serial) {
        app.message.error("Serial not available.")

        return <>
            Serial not available, please try again.
        </>
    }

    const handleOnFinish = async (values) => {
        context.setValue("alias", values.alias)
        context.setValue("behavior", values.behavior)

        const result = await NFCModel.registerTag(context.values.serial, {
            alias: values.alias,
            behavior: values.behavior
        }).catch((err) => {
            console.error(err)

            app.message.error("Cannot register your tag. Please try again.")

            return false
        })

        if (!result) {
            return false
        }

        if (!result.endpoint_url) {
            app.message.error("Cannot register your tag. Please try again.")
            return false
        }

        if (props.onFinish) {
            app.message.success("All changes have been saved.")
            return props.onFinish(result)
        }

        app.message.success("Your tag has been registered successfully.")

        context.setValue("endpoint_url", result.endpoint_url)

        return context.next()
    }

    return <div className="tap-share-register_step">
        <h2>
            Tag Data
        </h2>

        <antd.Form
            name="register_tag"
            onFinish={handleOnFinish}
            initialValues={{
                serial: context.values.serial,
                alias: context.values.alias,
                behavior: context.values.behavior,
            }}
        >
            <antd.Form.Item
                name="serial"
                label={<>
                    <Icons.MdTag />
                    Serial
                </>}
            >
                <Input
                    disabled
                />
            </antd.Form.Item>
            <antd.Form.Item
                name="alias"
                label={<>
                    <Icons.Tag />
                    Alias
                </>}
                rules={[
                    {
                        required: true,
                        message: "Please input an alias."
                    }
                ]}
            >
                <antd.Input
                    placeholder="Short name for your tag"
                />
            </antd.Form.Item>

            <antd.Form.Item
                label={<>
                    <Icons.MdWebhook />
                    Behavior
                </>}
            >
                <span className="description">
                    What will happen when someone taps your tag?
                </span>

                <div className="ant-form_with_selector">
                    <antd.Form.Item
                        name={["behavior", "type"]}
                        noStyle
                        size="large"
                        rules={[
                            {
                                required: true,
                                message: "Please select your tag behavior."
                            }
                        ]}
                    >
                        <antd.Select
                            placeholder="Options"
                            size="large"
                        >
                            <antd.Select.Option
                                value="url"
                            >
                                Custom URL
                            </antd.Select.Option>

                            <antd.Select.Option
                                value="profile"
                            >
                                Profile
                            </antd.Select.Option>

                            <antd.Select.Option
                                value="post"
                            >
                                Post
                            </antd.Select.Option>
                        </antd.Select>
                    </antd.Form.Item>

                    <antd.Form.Item
                        name={["behavior", "value"]}
                        noStyle
                        rules={[
                            {
                                required: true,
                                message: "Please select your behavior value."
                            }
                        ]}
                    >
                        <antd.Input
                            placeholder="value"
                            size="large"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    </antd.Form.Item>
                </div>
            </antd.Form.Item>

            <antd.Form.Item
                colon={false}
            >
                <antd.Button
                    block
                    type="primary"
                    size="large"
                    htmlType="submit"
                >
                    Save
                </antd.Button>
            </antd.Form.Item>
        </antd.Form>
    </div>
}