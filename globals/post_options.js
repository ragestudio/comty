import * as Icons from '@ant-design/icons'

export var Post_Options = [
  {
    key: 'pro_boost',
    icon: <Icons.RocketOutlined />,
    type: 'switch',
    title: 'CPRO™ Boost',
    description: '',
    require: 'pro',
    value: false,
  },
  {
    key: 'allow_comments',
    icon: <Icons.CommentOutlined />,
    type: 'switch',
    title: 'Allow Comments',
    description: '',
    require: '',
    value: true,
  },
]
