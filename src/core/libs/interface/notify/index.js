import { notification, message } from 'antd'
import * as Icons from 'components/Icons'

export const notify = {
    fatal: (...res) => {
      notification.error({
        message: 'Fatal Error',
        icon: <Icons.Triangle style={{ color: '#fa8c16' }} />,
        description: res,
        placement: 'bottomLeft'
      })
    },
    expire: (...res) => {
      notification.error({
        message: 'Hey ',
        icon: <Icons.FieldTimeOutlined />,
        description: res,
        placement: 'bottomLeft',
      })
    },
    info: (...res) => {
      notification.info({
        message: 'Well',
        description: res.toString(),
        placement: 'bottomLeft',
      })
    },
    exception: (...res) => {
      notification.error({
        message: 'WoW!',
        description: res.toString(),
        placement: 'bottomLeft',
      })
    },
    warn: (...res) => {
      notification.warn({
        message: 'Hey!',
        description: res.toString(),
        placement: 'bottomLeft',
      })
    },
    success: (...res) => {
      notification.success({
        message: 'Well',
        description: res.toString(),
        placement: 'bottomLeft',
      })
    },
    error: (...res) => {
      notification.error({
        message: 'Wopss',
        description: (
          <div>
            <span>An wild error appear! : </span>
            <br />
            <br />
            <div
              style={{
                position: 'relative',
                width: '100%',
                backgroundColor: 'rgba(243, 19, 19, 0.329)',
                bottom: '0',
                color: 'black',
                padding: '3px',
              }}
            >
              {res.toString()}
            </div>
          </div>
        ),
        placement: 'bottomLeft',
      })
    },
    proccess: (...res) => {
      notification.open({
        icon: <Icons.LoadingOutlined style={{ color: '#108ee9' }} />,
        message: 'Please wait',
        description: <div>{res}</div>,
        placement: 'bottomLeft',
      })
    },
    open: (props) => {
      notification.open({
        placement: props.placement? props.placement : 'bottomLeft',
        duration: props.duration? props.placement : 15,
        icon: props.icon? props.icon : <Icons.Triangle style={{ color: '#fa8c16' }} />,
        message: props.message? props.message : '',
        description: props.description? props.description : ''
      })
    },
   
  }