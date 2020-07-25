import React from 'react'
import { About } from 'components'
import l from 'globals/links'
import * as Icons from 'components/Icons'
import * as antd from 'antd'



export default class AppAbout extends React.Component {
  render() {
    return <>
    <About />
    <antd.Card>
      <div>
        <h4>🎉✨ It's completely free and open source !</h4>
        <h5>It is an impressive amount of work and effort, help us to continue offering quality services, you can support us from our patreon campaign.</h5>
        <a href={l.patreon}><Icons.Patreon/> Support us with Patreon!</a>
      </div>
      <antd.Divider dashed />
      <div>
        <h4>👨‍💻 You are developer? You can help us by joining our team!</h4>
        <a href={l.gitlab}><Icons.Gitlab />Official Repository</a><br />
        <a href={l.github}><Icons.GitHub />Mirror Repository</a><br />
        <a href={l.trellojoin}><Icons.Trello />Join our Trello</a>
      </div>
    </antd.Card>


    </>
  }
}

