import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'

import {PostCard} from 'components'

export function RefreshFeed(){
    ycore.yconsole.log('Refreshing Feed...')
    window.MainFeedComponent.FirstGet();
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

    componentDidMount(){
        this.FirstGet()
    }

    toogleLoader(){
        this.setState({ loading: !this.state.loading })
    }
 
    FirstGet() {
         try{
             const { get, uid, filters } = this.props;
             if (!get) {
                 ycore.yconsole.error('Please, fill params with an catch type...')
                 return
             }
             this.toogleLoader()
             ycore.GetPosts(uid, get, '0', (err, result) => {
                 const parsed = JSON.parse(result)['data']
                 const isEnd = parsed.length < ycore.DevOptions.limit_post_catch? true : false 
                 this.setState({ isEnd: isEnd, data: parsed, loading: false })
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
             const getLastPost = ycore.objectLast(this.state.data)
             ycore.yconsole.log('LAST POST ID =>', getLastPost.id)
             
             ycore.GetPosts(uid, get, getLastPost.id, (err, res) => { 
                 if (err){return false} 
                 const oldData = this.state.data
                 const parsed = JSON.parse(res)['data']
                 const mix = oldData.concat(parsed)
                 const isEnd = parsed.length < ycore.DevOptions.limit_post_catch? true : false 
                 this.setState({ isEnd: isEnd, data: mix, loading: false }, () =>  ycore.gotoElement(getLastPost.id) )
                 return true
                })
         }catch(err){
             ycore.notifyError(err)
         }
    
    }
    
    renderFeedPosts = () =>{
        const {data, loading, isEnd} = this.state  
        const loadMore =
        !isEnd && !loading ? (
          <div style={{
              textAlign: 'center',
              marginTop: 12,
              height: 32,
              lineHeight: '32px',
            }}
          >
            <antd.Button type="ghost" icon={<Icons.DownSquareOutlined />} onClick={() => this.GetMore()} />
          </div>
        ) : null;      
        try {
            ycore.yconsole.log(data)
            return (
              <antd.List
                  loadMore={loadMore}
                  dataSource={data}
                  renderItem={item => (<div id={item.id}><PostCard payload={item} key={item.id} /></div>)}
              />
            )
        } catch (err) {
            return false
        }
    }

    render(){
        const { loading } = this.state;
        return (
           <div id='mainfeed'> 
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