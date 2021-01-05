import * as antd from "antd";
import * as Icons from 'feather-reactjs'
import { connect } from 'umi'
import { objectToArrayMap } from '@nodecorejs/utils'

const stageToColor = {
  undefined: "red",
  "alpha": "green",
  "beta": "blue",
  "dev": "red"
}

@connect(({ app }) => ({ app }))
export default class LastestVersion extends React.Component {
  selectVersionModal = null

  state = {
    selectedId: null
  }

  handleSelectRelease(id) {
    console.log("selected =>", id)
    this.setState({ selectedId: id })
    this.selectVersionModal.update({
      okText: id,
      okButtonProps: { disabled: false }
    })
  }

  handleOpenModal() {
    const genMenu = () => {
      return (
        this.props.app.versions.map(id => {
          const element = this.props.app.releases[id]
          return (
            <antd.Menu.Item key={element.id}>
              v{element.tag_name}[{element.name}]
            </antd.Menu.Item>
          )
        })
      )
    }

    this.selectVersionModal = antd.Modal.confirm({
      okText: "Select an version",
      okButtonProps: { disabled: true },
      onOk: () => {
        this.props.dispatch({
          type: "app/selectFromId",
          id: this.state.selectedId
        })
      },
      icon: <div style={{ width: "fit-content", fontSize: "18px", justifyContent: "center", display: "flex", lineHeight: "32px" }}><Icons.Package style={{ color: "#faad14", fontSize: "28px", marginRight: "12px" }} />Select an release</div>,
      content: <antd.Menu onSelect={(e) => { this.handleSelectRelease(e.key) }} >{genMenu()}</antd.Menu>
    })
  }



  render() {
    const { selected } = this.props.app

    if (this.props.app.loading) {
      return <antd.Tag> {"Getting version..."} </antd.Tag>
    }

    else {
      return <>
        <antd.Tooltip title={selected.prerelease ? "Development build" : "Stable"} color={selected.prerelease ? "gold" : "#87d068"}>
          <antd.Tag onDoubleClick={() => this.handleOpenModal()} color={stageToColor[selected.packagejson.stage]} ><Icons.Package />v{selected.tag_name}</antd.Tag>
        </antd.Tooltip>
        <antd.Tag><Icons.Radio />{selected.packagejson.stage}</antd.Tag>
      </>
    }
  }
}