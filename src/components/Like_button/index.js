import React from 'react'
import styles from './index.scss'
import * as ycore from 'ycore'
import classnames from 'classnames'

class Like_button extends React.PureComponent {
  constructor(props) {
    super(props),
    this.state = {
      liked: this.props.liked,
      likes: this.props.count,
      type: this.props.liked ? 'dislike' : 'like',
      clicked: false,
    }
  }

  SumLike() {
    this.setState({
      likes: parseInt(this.state.likes) + 1,
      type: 'dislike',
    })
    setTimeout(() => {
      this.setState({ liked: true })
    }, 500)
  }
  RestLike() {
    this.setState({
      likes: parseInt(this.state.likes) - 1,
      type: 'like',
    })
    setTimeout(() => {
      this.setState({ liked: false })
    }, 500)
  }

  dispatchLike(e) {
    const { type } = this.state
    ycore.yconsole.log(`Dispatch ${type} to post id => ${e}`)
    this.setState({ clicked: true })
    setTimeout(() => {
      this.setState({ clicked: false })
    }, 500)
    const payload = { post_id: e }
    ycore.comty_post.like((err, res) => {
      if (err) {
        ycore.notify.error(res)
        return
      }
      if (type == 'like') {
        this.SumLike()
      }
      if (type == 'dislike') {
        this.RestLike()
      }
    }, payload)
  }
  render() {
    const { id } = this.props
    const { likes, liked, clicked } = this.state
    if (!id) {
      ycore.yconsole.error('[LikeBTN] No post id provided!')
      return null
    }
    return (
      <div className={styles.btnWrapper}>
        <button
          onClick={() => this.dispatchLike(id)}
          className={classnames(styles.like_button, {
            [styles.clickanim]: clicked,
          })}
        >
          <div className={styles.like_wrapper}>
            <div
              className={classnames(
                styles.ripple,
                liked ? null : { [styles.clickanim]: clicked }
              )}
            ></div>
            <svg
              className={classnames(
                styles.heart,
                { [styles.empty]: !liked },
                liked ? null : { [styles.clickanim]: clicked }
              )}
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"></path>
            </svg>
          </div>
        </button>
        <p
          className={classnames(styles.likeCounter, {
            [styles.active]: !clicked,
            [styles.past]: clicked,
          })}
        >
          {likes}
        </p>
      </div>
    )
  }
}

export default Like_button
