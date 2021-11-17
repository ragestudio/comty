import handlers from './handlers'
import { message, notification } from 'antd'

const events = {
    invalidSidebarKey: (event) => {
        console.error(`[invalidSidebarKey] >>`, event)
        notification.error({
            message: `An error seems to have occurred trying to open this.`,
            description: "We will report this automatically"
        })
    }
}

export default events