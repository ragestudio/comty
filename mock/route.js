import {
  Constant
} from './_utils'
const {
  ApiPrefix
} = Constant

const database = [
  
  // DASHBOARD SECTION
  {
    id: '1',
    icon: 'home',
    name: 'Main',
    route: '/main',
  },

  // ACCOUNT SECTION
  {
    id: '2',
    breadcrumbParentId: '1',
    name: 'Account',
    icon: 'user',
  },
  {
    id: '21',
    breadcrumbParentId: '2',
    menuParentId: '2',
    name: 'YulioID™',
    icon: 'user',
    route: '/account',
  },   
  {
    id: '22',
    breadcrumbParentId: '2',
    menuParentId: '2',
    name: 'YulioPay™',
    icon: 'wallet',
    route: '/wallet',
  },
  {
    id: '23',
    breadcrumbParentId: '2',
    menuParentId: '2',
    name: 'Vault',
    icon: 'save',
    route: '/account',
  },  
 
 
  // RESOURCES SECTION
  {
    id: '3',
    breadcrumbParentId: '1',
    name: 'Resources',
    icon: 'compass',
  },
  {
    id: '31',
    breadcrumbParentId: '3',
    menuParentId: '3',
    name: 'Marketplace',
    icon: 'shopping-cart',
    route: '/resources/marketplace',
  },
  {
    id: '32',
    breadcrumbParentId: '3',
    menuParentId: '3',
    name: 'Apps',
    icon: 'desktop',
    route: '/resources/apps',
  },
  {
    id: '33',
    breadcrumbParentId: '3',
    menuParentId: '3',
    name: 'Download Manager',
    icon: 'build',
    route: '/resources/dl',
  },
  {
    id: '34',
    breadcrumbParentId: '3',
    menuParentId: '3',
    name: 'Other Services',
    icon: 'compass',
    route: '/resources/otherservices',
  },
  
  // CloudStudio
  {
    id: '4',
    breadcrumbParentId: '1',
    name: 'Cloud Studio',
    icon: 'cloud',
  },
  {
    id: '42',
    breadcrumbParentId: '4',
    menuParentId: '4',
    name: 'Workspaces',
    icon: 'deployment-unit',
    route: '/changelogs',
  },
  {
    id: '43',
    breadcrumbParentId: '4',
    menuParentId: '4',
    name: 'Cloud Computing',
    icon: 'cloud-server',
    route: '/help',
  },
  {
    id: '44',
    breadcrumbParentId: '4',
    menuParentId: '4',
    name: 'GIT',
    icon: 'branches',
    route: '/about',
  },
  // Project Manager
  {
    id: '5',
    breadcrumbParentId: '1',
    name: 'Project Manager',
    icon: 'team',
  },
  {
    id: '51',
    breadcrumbParentId: '5',
    menuParentId: '5',
    name: 'Project Manager',
    icon: 'reconciliation',
    route: '/help',
  },
  {
    id: '52',
    breadcrumbParentId: '5',
    menuParentId: '5',
    name: 'Teams',
    icon: 'team',
    route: '/changelogs',
  },
  
]

module.exports = {
  [`GET ${ApiPrefix}/routes`](req, res) {
    res.status(200).json(database)
  },
}