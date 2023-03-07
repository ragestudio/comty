import React from "react"
import { ViewportList } from "react-viewport-list"
import { PostCard, LoadMore } from "components"

import "./index.less"

const useCenteredContainer = () => {
    React.useEffect(() => {
        app.layout.toogleCenteredContent(true)

        return () => {
            app.layout.toogleCenteredContent(false)
        }
    }, [])
}

const useHacks = (hacks) => {
    React.useEffect(() => {
        window._hacks = hacks

        return () => {
            delete window._hacks
        }
    }, [])
}

function generateRandomData() {
    return {
        _id: Math.random().toString(36).substr(2, 9),
        message: `Random post ${Math.random().toString(36).substr(2, 9)}`,
        user: {
            _id: Math.random().toString(36).substr(2, 9),
            username: `Random user ${Math.random().toString(36).substr(2, 9)}`,
            avatar: `https://avatars.dicebear.com/api/initials/${Math.random().toString(36).substr(2, 9)}}.svg`,
        },
        countLikes: Math.floor(Math.random() * 100),
        hasLiked: Math.random() > 0.5,
    }
}

const defaultList = new Array(20).fill(0).map(() => generateRandomData())

console.log(defaultList)

export default (props) => {
    const listRef = React.useRef()

    const [list, setList] = React.useState(defaultList)

    const appendPost = (post) => {
        setList((list) => {
            return [post, ...list]
        })
    }

    const removePost = (_id) => {
        setList((list) => {
            return list.filter((post) => {
                return post._id !== _id
            })
        })
    }

    const removeFirstPost = () => {
        setList((list) => {
            return list.slice(1)
        })
    }

    const onLoadMore = () => {
        const newList = new Array(20).fill(0).map(() => generateRandomData())

        setList((list) => {
            return [...list, ...newList]
        })
    }

    useCenteredContainer()

    useHacks({
        appendPost: appendPost,
        remove: removePost,
        deleteFirst: removeFirstPost,
        addRandom: () => {
            appendPost(generateRandomData())
        },
    })

    return <div
        ref={listRef}
        className="list"
    >
        <ViewportList
            viewportRef={listRef}
            items={list}
        >
            {(item) => <PostCard
                key={item._id}
                data={item}
            />}
        </ViewportList>

        <button
            onClick={onLoadMore}
        >
            Load more
        </button>
    </div>
} 