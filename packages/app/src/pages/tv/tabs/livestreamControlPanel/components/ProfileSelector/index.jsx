import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
//import { useTranslation } from "react-i18next"

const ProfilesDropboxCustomRender = (props) => {
    return <>
        {props.menu}

        <antd.Divider style={{ margin: '8px 0' }} />

        <antd.Space style={{ padding: '0 8px 4px' }}>
            <antd.Input
                placeholder="Profile name"
                ref={props.inputRef}
                value={props.inputValue}
                onChange={props.onInputChange}
            />
            <antd.Button
                type="text"
                icon={<Icons.Plus />}
                onClick={props.onClickAdd}
            >
                Create
            </antd.Button>
        </antd.Space>
    </>
}

export default (props) => {
    const [inputValue, setInputValue] = React.useState("")

    const onInputChange = (e) => {
        setInputValue(e.target.value)
    }

    const onAddNewProfile = async () => {
        const value = inputValue.trim()

        if (!value) {
            return
        }

        setInputValue("")

        props.onCreateProfile(value)
    }

    return <antd.Select
        loading={props.loading}
        placeholder="Select a streaming profile"
        value={props.value}
        onChange={(_id, item) => props.onChangeProfile(_id, item)}
        dropdownRender={(menu) => <ProfilesDropboxCustomRender
            inputValue={inputValue}
            onInputChange={onInputChange}
            onClickAdd={onAddNewProfile}
            menu={menu}
        />}
        options={props.profiles.map((item) => ({
            label: item.profile_name,
            value: item._id,
        }))}
    />
}