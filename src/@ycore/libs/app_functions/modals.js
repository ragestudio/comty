import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './modals.less';


class __Model_postreport extends React.PureComponent {
    state = {
        step: 1
    }
    end(){
        if(this.props.id){
            const payload = { post_id: this.props.id }
            ycore.comty_post.__report((err, res) => {
              if (err) {
                return false
              }
              ycore.notify.info('This post has been reported successfully, our team will review it and inform you about problem resolution ...')
              ycore.FeedHandler.refresh()
              ycore.FeedHandler.goToElement(this.props.id)
            }, payload)
        }
        setTimeout(() => {
            ycore.SecondarySwap.close()
        }, 500)

    }
    next(){
        let a = this.state.step
        
        if(a<3)a++
        this.setState({step: a })
    }
    status(i){
        const a = this.state.step
        if (a==i) return 'process'
        if (a>i) return 'finish'
        if (a<i) return 'wait'
    }
    renderStep(){
        const a = this.state.step
        switch (a) {
            case 1:
               return (
                <div className={styles.post_report_body}>
                <h1>Report an post</h1>
                <p>This tool is intended for the community in a public way to help identify problematic or abusive content and for legitimate purposes.</p><br/>
                <p>To ensure the proper use of this tool, before proceeding, you must understand the following:</p>
                <antd.Checkbox onChange={this.validate.term_1}>I understand and agree that my complaint may be sent to the party that posted the content in question.</antd.Checkbox>
                <antd.Checkbox onChange={this.validate.term_2}>I understand that the abuse of this tool may have consequences for my account</antd.Checkbox>
                <br/><br/>{this.state.term_1 && this.state.term_2? <antd.Button onClick={() => this.next()} >Next</antd.Button> : null}
                </div>  
               )
            case 2: 
                return( 
                <div className={styles.post_report_body}>
                    <br/>
                    <h3>For this report or complaint to be fair, make sure that the reason is for the following reasons:</h3>
                    <br/>
                    <p>- Harmful content or hate speech</p>
                    <p>- Violent or repulsive content</p>
                    <p>- Misleading advertising or spam</p>
                    <p>- Illegal activities</p>
                    <p>- Sexual content</p>
                    <p>- Or any other activity that violates the terms and conditions of use</p>
                    <antd.Checkbox onChange={this.validate.term_3}>I am sure and understand that the reason for this report is included in the above list.</antd.Checkbox>
                    <br/><br/>{this.state.term_3? <antd.Button onClick={() => this.next()} >Next</antd.Button> : null}

                </div>
                )
            case 3:
                return (
                    <div className={styles.post_report_body}>
                        <br/>
                        <h3>Given the above circumstances, to send this report or report please confirm that you understand and are following that you want to carry out this action</h3>
                        <antd.Checkbox onChange={this.validate.confirm}>I am sure of what I do and I want to send this complaint or report</antd.Checkbox>
                        <br/><br/>{this.state.term_confirm? <antd.Button onClick={() => this.end()} >Send report</antd.Button> : null}

                    </div>
                )
            default:
                return null
        }
    }
    validate = {
        term_1: (e) =>{this.setState({ term_1: e.target.checked })},
        term_2: (e) =>{this.setState({ term_2: e.target.checked })},
        term_3: (e) =>{this.setState({ term_3: e.target.checked })},
        confirm: (e) =>{this.setState({ term_confirm: e.target.checked })}
    }

    render(){
        return(
            <div className={styles.post_report_main}>
                <div>
                    <antd.Steps>
                       <antd.Steps.Step status={this.status(1)} title="Summary" icon={<Icons.SolutionOutlined />} />
                       <antd.Steps.Step status={this.status(2)} title="Confirm" icon={<Icons.AuditOutlined />} />
                       <antd.Steps.Step status={this.status(3)} title="Done" icon={<Icons.CheckCircleOutlined />} />
                    </antd.Steps>
                </div>
                {this.renderStep()}
            </div>
        )
    }
}


export const app_modals = {
    report_post: (post_id) => {
        antd.Modal.confirm({
            title: 'Report an post',
            icon: <Icons.FrownOutlined />,
            content: 'It seems that you want to report this post, first of all it is necessary that you take into account that this tool is only intended for serious cases and we need you to comply with some questions to be able to report this post and to guarantee the quality of service ...',
            onOk() {
                return ycore.SecondarySwap.openFragment(<__Model_postreport id={post_id} />)
            },
            onCancel() {
                return false
            },
          });
    }
}