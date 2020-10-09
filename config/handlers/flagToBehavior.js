import { notification, message } from 'antd'
import * as Icons from 'components/Icons'
import errStrings from 'config/handlers/errToStrings.js'
import errNumbers from 'config/handlers/numToError.js'
import errFlags from  'config/handlers/errToFlag.js'

export default {
    SESSION_INVALID: (payload) => {
        notification.error({
          message: payload.msg ?? 'Hey',
          icon: <Icons.FieldTimeOutlined />,
          description: errStrings[payload.out] ?? "This session is not valid",
          placement: 'bottomLeft',
        })
    },
    OVERLAY_BADPOSITION: () => {
        
    },
    INTERNAL_PROCESS_FAILED: () =>{

    },
    INVALID_DATA: () => {

    },
    INVALID_PROPS: () => {

    },
    MISSING_REQUIRED_PAYLOAD: () => {

    },
    INVALID_INDEX: () => {

    }
}