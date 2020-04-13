import React from 'react'
import { PostCard } from 'components'
import { yconsole } from 'ycore'
import { Button, List } from 'antd'
import { DownSquareOutlined } from '@ant-design/icons'
const renderFeedPosts = payload => {
  const { data, loading, isEnd, feedGet } = payload
  const loadMore =
    !isEnd && !loading ? (
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          height: 32,
          lineHeight: '32px',
        }}
      >
        <Button
          type="ghost"
          icon={<DownSquareOutlined />}
          onClick={() => feedGet.more()}
        />
      </div>
    ) : null
  try {
    yconsole.log(data)
    return (
      <List
        loadMore={loadMore}
        dataSource={data}
        renderItem={item => (
          <div id={item.id}>
            <PostCard payload={item} key={item.id} />
          </div>
        )}
      />
    )
  } catch (err) {
    return false
  }
}

export default renderFeedPosts
