import React from 'react'
import { About } from 'components'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import l from 'schemas/links'

export default class AppAbout extends React.Component {
  render() {
    const handleClickLinks = (e) => {
      const link = l[e]
      link? window.openLink(link) : console.log("Link not available")
    }
    return <>
    <About />
    <antd.Card>
      <div>
        <h4>🎉✨ It's completely free and open source !</h4>
        <h5>It is an impressive amount of work and effort, help us to continue offering quality services, you can support us from our patreon campaign.</h5>
        <a onClick={() => handleClickLinks("patreon")}><Icons.Patreon/> Support us with Patreon!</a>
      </div>
      <antd.Divider dashed />
      <div>
        <h4>👨‍💻 You are developer? You can help us by joining our team!</h4>
        <a onClick={() => handleClickLinks("github")}><Icons.GitHub />Official Repository</a><br />
        <a onClick={() => handleClickLinks("trello")}><Icons.Trello />Join our Trello</a>
      </div>
    </antd.Card>
    </>
  }
}

