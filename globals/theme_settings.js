import { Image, Sidebar, Droplet, FontColorsOutlined, Volume2, Moon } from 'components/Icons'

export default [
    {
      id: 'backgroundImage',
      icon: <Image />,
      title: 'Background',
      description: 'Change the background of the app',
    },
    {
      id: 'overlay',
      icon: <Sidebar />,
      title: 'Overlay',
      description: 'Description blah blah',
    },
    {
      id: 'color',
      icon: <Droplet />,
      title: 'Colors',
      description: 'Texts, Buttons, Sliders ...etc',
    },
    {
      id: 'text',
      icon: <FontColorsOutlined style={{ marginRight: '10px' }} />,
      title: 'Text',
      description: 'Sizes, Fonts',
    },
    {
      id: 'sounds',
      icon: <Volume2 />,
      title: 'Sounds',
      description: 'BlipBlopBLup',
    },
    {
      id: 'darkmode',
      icon: <Moon />,
      title: 'Dark Mode',
      description: 'Yeaah, no more daying',
    }
]
