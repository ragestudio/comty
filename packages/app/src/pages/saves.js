import React from 'react'
import { connect } from 'umi'
import { PostsFeed } from 'components'

@connect(({ app }) => ({ app }))
export default class Saves extends React.Component{
    render(){
        return <PostsFeed from="saved" />
    }
}