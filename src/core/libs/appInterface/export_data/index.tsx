import * as React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { downloadDecodedURI } from 'core'

export interface exportData_props {
    data: string;
    type:  string;
}

const exportCodeRender = (data) => {
    if(data.length > 500){
        return <div style={{ textAlign: 'center', width: '100%', padding: '30px 0 30px 0' }}>
            <Icons.HardDrive style={{ fontSize: '45px', margin: '0' }} />
            <h4>Hey, this file is too much large!</h4>
            <h3>So it couldn't be displayed.</h3>
        </div>
    }
    return <div>
        {data}
    </div>
}

const exportData_render = (props: exportData_props) => {
    antd.Modal.confirm({
        title: <div><Icons.Code /> Your export <antd.Tag> {`${props.type.split("/")[1]}`} </antd.Tag></div>,
        icon: null,
        onOk: () => downloadDecodedURI({data: props.data, type: props.type}),
        okText: <><Icons.Download />Download as File</> ,
        cancelText: "Done",
        content: exportCodeRender(props.data),
    });
}

exportData_render.defaultProps = {
    data: '',
    type: 'text/txt',
}

export default exportData_render