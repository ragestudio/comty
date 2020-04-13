import { Card } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const ComponentInvalid = fn => {
  return (
    <Card
      style={{
        borderRadius: '10px',
        maxWidth: '26.5vw',
        margin: 'auto',
        textAlign: 'center',
      }}
    >
      <h2>
        <ExclamationCircleOutlined /> Invalid Data
      </h2>
      <span>
        If this error has occurred several times, try restarting the app
      </span>
    </Card>
  )
}

export default ComponentInvalid 
