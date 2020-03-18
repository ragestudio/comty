import * as Icons from '@ant-design/icons'

export var Post_Options = [
    {
        "option": "pro_boost",
        "icon": <Icons.RocketOutlined />,
        "type" : "switch",
        "title": "CPRO™ Boost",
        "description": "",
        "require": "pro",
        "value":  false
    },
    {
        "option": "allow_likes",
        "icon": <Icons.HeartOutlined />,
        "type" : "switch",
        "title": "Allow Likes",
        "description": "",
        "require": "",
        "value":  true
    },
    {
        "option": "allow_comments",
        "icon": <Icons.CommentOutlined />,
        "type" : "switch",
        "title": "Allow Comments",
        "description": "",
        "require": "",
        "value":  true
    },
]
