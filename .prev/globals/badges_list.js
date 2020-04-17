import * as Icons from '@ant-design/icons'


export var BadgesType = [
  {
    id: 'alpha_test',
    title: 'Alpha Tester',
    color: 'green',
    require: '',
    icon: (<Icons.BugOutlined />),
    tip: 'Oh yeah!'
  },
  {
    id: 'nsfw_flag',
    title: 'NSFW',
    color: 'volcano',
    require: 'nsfw_flag',
    icon: (<Icons.RocketOutlined />),
    tip: 'NSFW',
  },
  {
    id: 'pro',
    title: 'CPRO™',
    color: 'purple',
    require: 'pro',
    icon: (<Icons.RocketOutlined />),
    tip: 'CPRO™',
  },
  {
    id: 'dev',
    title: 'DEVELOPER',
    color: 'default',
    require: 'dev',
    icon: (<Icons.RocketOutlined />),
    tip: 'DEVELOPER',
  },
  {
    id: 'professional_retarder',
    title: 'Professional Retarder',
    color: 'gold',
    require: '',
    icon: (<Icons.SmileOutlined />),
    tip: 'hump....',
  }
]
