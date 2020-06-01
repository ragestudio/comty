import * as Icons from 'components/Icons'

export var BadgesType = [
  {
    id: 'alpha_test',
    title: 'Alpha Tester',
    color: 'green',
    require: '',
    icon: (<Icons.BugOutlined  />),
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
    icon: (<Icons.GitBranch style={{marginRight: 'unset', verticalAlign: "-0.125em"}} />), // 
    tip: 'DEVELOPER',
  },
  {
    id: 'professional_retarder',
    title: 'Professional Retarder',
    color: 'gold',
    require: '',
    icon: (<Icons.SmileOutlined />),
    tip: 'hump....',
  },
  {
    id: 'el_walter_pro',
    title: 'Pro Chikito',
    color: '#a0d911',
    require: '',
    icon: ("🐱‍🐉🧜‍♀️"),
    tip: 'Chikito',
  },
  {
    id: 'patreon',
    title: 'Patreon Member',
    color: '',
    require: '',
    icon: (<Icons.Patreon />),
    tip: 'Nigas',
  }
]
