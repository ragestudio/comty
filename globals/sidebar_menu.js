import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'
import {CustomIcons} from 'components'
import * as Feather from 'feather-reactjs'

let MenuList = [
    {
        id: 'main',
        title: 'Main',
        path: '/main',
        require: 'login',
        icon: <Feather.Home />,
    },
    {
        id: 'explore',
        title: 'Explore',
        path: '/explore',
        require: 'login',
        icon: <Feather.Compass />,
    },
    {
        id: 'saves',
        title: 'Saves',
        path: '/saves',
        require: 'login',
        icon: <Feather.Bookmark />,
    },
    {
        id: 'messages',
        title: 'Messages',
        path: '/messages',
        require: 'login',
        icon: <Feather.MessageSquare />,
    },
    {
        id: 'notifications',
        title: 'Notifications',
        path: '/notifications',
        require: 'login',
        icon: <Feather.Inbox/>,
    },
]

export default MenuList