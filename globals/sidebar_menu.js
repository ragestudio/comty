import * as Icons from 'components/Icons'

let MenuList = [
    {
        id: 'main',
        title: 'Main',
        path: '/main',
        require: 'login',
        icon: <Icons.Home />,
        mobile: 'true'
    },
    {
        id: 'explore',
        title: 'Explore',
        path: '/explore',
        require: 'login',
        icon: <Icons.Compass />,
        mobile: 'true'
    },
    {
        id: 'saves',
        title: 'Saves',
        path: '/saves',
        require: 'login',
        icon: <Icons.Bookmark />,
        mobile: 'false'
    },
    {
        id: 'messages',
        title: 'Messages',
        path: '/messages',
        require: 'login',
        icon: <Icons.MessageSquare />,
        mobile: 'false'
    },
    {
        id: 'notifications',
        title: 'Notifications',
        path: '/notifications',
        require: 'login',
        icon: <Icons.Inbox/>,
        mobile: 'false'
    },
]

export default MenuList