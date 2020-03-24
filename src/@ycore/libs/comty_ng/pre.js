import { token_data } from 'ycore'
import * as Icons from '@ant-design/icons'
import { RenderFeed } from 'components/MainFeed'

export * from './comty_post.js'
export * from './comty_user.js'
export * from './comty_post_comment.js'
export * from './get_app_session.js'
export * from './comty_search.js'
export * from './comty_get.js'

export const FeedHandler = {
  refresh: () => {
    RenderFeed.RefreshFeed()
  },
  killByID: (post_id) => {
    RenderFeed.killByID(post_id)
  },
  addToRend: (payload) => {
    RenderFeed.addToRend(payload)
  }
}

export const IsThisPost = {
  owner: (post_uid) => {
    const a = token_data.__id()
    if (post_uid == a) {
      return true
    }
    return false
  },
  boosted: () => {

  },
  pinned: () => {

  },
  flagged: () => {

  }
}

export const GetPostPrivacy = {
  bool: (e) => {
    switch (e) {
      case 'any':
          return '0'
      case 'only_followers':
          return '1'
      case 'only_follow':
          return '2'
      case 'private':
          return '3'
      default:
          return '0'
    }
  },
  decorator: (e) => {
      switch (e) {
          case 'any':
              return  <span><Icons.GlobalOutlined /> Share with everyone</span>
          case 'only_follow':
              return <span><Icons.TeamOutlined /> Share with people I follow</span>
          case 'only_followers':
              return <span><Icons.UsergroupAddOutlined /> Share with people follow me</span> 
          case 'private':
              return <span><Icons.EyeInvisibleOutlined /> Dont share, only me</span>
          default:
              return <span>Unknown</span>
      }
  },

}