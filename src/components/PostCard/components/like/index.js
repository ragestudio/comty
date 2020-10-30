import React from 'react'
import styles from './index.less'
import * as core from 'core'
import classnames from 'classnames'
import verbosity from 'core/libs/verbosity'

export default class LikeBtn extends React.Component {
  state = {
    liked: this.props.liked,
    count: this.props.count,
    clicked: false,
  }

  handleClick() {
    let done = false
    if (typeof (this.props.handleClick) !== "undefined") {
      this.setState({ clicked: true })

      this.props.handleClick((callback) => {
        if (typeof (callback) !== "object") {
          this.setState({ count: callback })
        } else {
          verbosity(`Invalid response`)
          this.setState({ clicked: false, liked: false })
        }
        setTimeout(() => {
          this.setState({ clicked: false, liked: !this.state.liked })
        }, 150)
        done = true
      }, setTimeout(() => {
        if (!done) {
          verbosity(`like click timeout!`)
          this.setState({ clicked: false })
        }
      }, 3000))



    } else {
      return false
    }
  }

  getDecoratorCount(count) {
    return `${core.abbreviateCount(new Number(count).toString())}`
  }

  render() {
    const { liked, clicked, count } = this.state
    return (
      <div>
        <button onClick={() => { this.handleClick() }} className={classnames(styles.like_button, { [styles.clickanim]: clicked })} >
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
        <div className={styles.likesIndicator} >
          <span className={classnames(styles.likeCounter, {
            [styles.active]: !clicked,
            [styles.past]: clicked,
          })} >
            {this.getDecoratorCount(count)}
          </span>
        </div>
      </div>
    )
  }
}