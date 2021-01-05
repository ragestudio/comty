import { Helmet } from 'react-helmet'
import { withRouter } from 'umi'
import { Header, Footer } from 'components'

@withRouter
class BaseLayout extends React.Component {  
    render() {
        const { children } = this.props
        return (
          <React.Fragment>
            <Helmet>
              <title>Comty Wrapper</title>
            </Helmet>
            <div className="landing_wrapper">     
              <div className="animation_shapes_wrapper">
                <div className="animation-shape shape-ring animation--rotating-diagonal">
                    <div></div>
                </div>
                <div className="animation-shape shape-circle animation--clockwise">
                    <div></div>
                </div>
                <div className="animation-shape shape-triangle animation--anti-clockwise">
                    <div className="animation--rotating"></div>
                </div>
                <div className="animation-shape shape-diamond animation--anti-clockwise">
                    <div className="animation--rotating"></div>
                </div>
                <div className="static-shape shape-ring-1"></div>
                <div className="static-shape shape-ring-2"></div>
                <div className="static-shape shape-circle-1"></div>
                <div className="static-shape pattern-dots-1"></div>
                <div className="static-shape pattern-dots-2"></div>
                <div className="static-shape ghost-shape ghost-shape-1"></div>
              </div>
              <Header />
              {children}
            </div>
          </React.Fragment>
        )
    }
}

export default BaseLayout
