import React from 'react';
import { PostCreator, MainFeed } from 'components';

export default class Main extends React.Component {
  render() {
    return (
      <>
        <PostCreator />
        <MainFeed auto={true} get="feed" />
      </>
    );
  }
}
