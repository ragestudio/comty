import { connect } from 'umi'

export default (children) => {
    return connect(({ app }) => ({ app }))(children)
}