import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'

import {PostCard} from 'components'

var userData = ycore.SDCP()


export function RefreshFeed(){
    ycore.yconsole.log('Refreshing Feed...')
    window.MainFeedComponent.handleRefreshList();
    return
}
class MainFeed extends React.Component {
    constructor(props){
        super(props)
        window.MainFeedComponent = this;
        this.state = {
            loading: false,
            data: [],
            fkey: 0
        }
    }
    handleRefreshList(){
        this.GetPostsData.first()
    }

    toogleLoader(){
        this.setState({ loading: !this.state.loading })
    }
    last (array, n) {
        if (array == null) 
          return void 0;
        if (n == null) 
           return array[array.length - 1];
        return array.slice(Math.max(array.length - n, 0));  
     };
    FirstGet(fkey) {
         try{
             const { get, uid, filters } = this.props;
             if (!get) {
                 ycore.yconsole.error('Please, fill params with an catch type...')
                 return
             }

             this.toogleLoader()
             ycore.GetPosts(uid, get, '0', (err, result) => {
                 this.setState({ data: JSON.parse(result)['data'], loading: false })
             })
         }catch(err){
             ycore.notifyError('err')
         }
    }

    GetMore(fkey){
         try{
             const { get, uid, filters } = this.props;
             if (!get) {
                 ycore.yconsole.error('Please, fill params with an catch type...')
                 return
             }
             if (!fkey) {
                 ycore.yconsole.warn('Please, provide a fkey for offset the feed, default using => 0');  
             }
             this.toogleLoader()
             const getLastPost = this.last(this.state.data)
             ycore.yconsole.log('LAST POST ID =>', getLastPost.id)
             ycore.GetPosts(uid, get, getLastPost.id, (err, res) => { 
                 if (err){return false} 
           
                 const oldData = this.state.data
                 const parsed = JSON.parse(res)['data']
                 const mix = oldData.concat(parsed)

                 this.setState({ data: mix, loading: false })
                 window.dispatchEvent(new Event('resize'));
                 return true
                
                })
    
           
         }catch(err){
             ycore.notifyError(err)
         }
    
    }
        

    componentDidMount(){
        this.FirstGet()
    }

    
    renderFeedPosts = () =>{
        const {data, loading} = this.state  
        const loadMore =
        !loading ? (
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              height: 32,
              lineHeight: '32px',
            }}
          >
            <antd.Button onClick={() => this.GetMore()}>More</antd.Button>
          </div>
        ) : null;      
        try {
      
            ycore.yconsole.log(data)
            return (
                <antd.List
                loadMore={loadMore}

                className="demo-loadmore-list"
                itemLayout="horizontal"
                dataSource={data}
                renderItem={item => (<PostCard payload={item} key={item.id} />)}
                />
                
            )
        } catch (err) {
            return false
        }
    }

    render(){
        const { loading } = this.state;

        return (
           <div> 
               { loading? 
                 <antd.Card style={{  maxWidth: '26.5vw', margin: 'auto' }} >
                        <antd.Skeleton avatar paragraph={{ rows: 4 }} active />
                 </antd.Card>
                : this.renderFeedPosts() 
                }
          
            </div>
        )
    }
}
export default MainFeed;