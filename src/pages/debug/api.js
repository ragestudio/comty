import React from 'react';
import {v3_request} from 'api';
import { api_request } from 'core/libs/v3_model'
import {
  Row,
  Col,
  Select,
  Form,
  Input,
  Button,
  List,
  Tag,
  Checkbox,
} from 'antd';
import classnames from 'classnames';
import { CloseOutlined } from '@ant-design/icons';
import endpoints_list from 'config/endpoints';

import styles from './api.less';

const { Option } = Select;
const InputGroup = Input.Group;
const methods = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

const methodTagColor = {
  GET: 'green',
  POST: 'orange',
  DELETE: 'red',
  PUT: 'geekblue',
};

const requests = Object.values(endpoints_list).map(item => {
  let url = item;
  let method = 'GET';
  const paramsArray = item.split(' ');
  if (paramsArray.length === 2) {
    method = paramsArray[0];
    url = paramsArray[1];
  }
  return {
    method,
    url,
  };
});

let uuid = 2;

export default class RequestPage extends React.Component {
  paramsForm = React.createRef();
  bodyDataForm = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      // Default sets
      method: 'GET',
      url: '',
      ParamsKeys: [1],
      BodyKeys: [1],
      result: null,
      visible: true,
    };
  }

  handleRequest = () => {
    const { method, url } = this.state;
    let params = {};
    let body = {};

    this.paramsForm.current
      .validateFields()
      .then(values => {
        if (values) {
          for (let i in values) {
            if (i.startsWith('check')) {
              const index = i.match(/check\[(\d+)\]/)[1];
              const key = values[`key[${index}]`];
              params[key] = values[`value[${index}]`];
            }
          }
        }
      })
      .catch(errorInfo => {
        console.log(errorInfo);
      });

    this.bodyDataForm.current
      .validateFields()
      .then(values => {
        if (values) {
          for (let i in values) {
            if (i.startsWith('check')) {
              const index = i.match(/check\[(\d+)\]/)[1];
              const key = values[`key[${index}]`];
              body[key] = values[`value[${index}]`];
            }
          }
        }
      })
      .catch(errorInfo => {
        console.log(errorInfo);
      });
      const frame = {
        method,
        endpoint: `${method} ${url}`,
        body,
        verbose: true
      }
      console.log(frame)
      api_request(frame, (err, res) => {
        this.setState({
          result: res,
        });
      })
  };

  handleClickListItem = ({ method, url }) => {
    this.setState({
      method,
      url,
      keys: [uuid++],
      result: null,
    });
  };

  handleInputChange = e => {
    this.setState({
      url: e.target.value,
    });
  };

  handleSelectChange = method => {
    this.setState({
      method,
    });
  };

  handleAddParam = () => {
    const { ParamsKeys } = this.state;
    const nextKeys = ParamsKeys.concat(uuid);
    uuid++;
    this.setState({
      ParamsKeys: nextKeys,
    });
  };

  handleAddBody = () => {
    const { BodyKeys } = this.state;
    const nextKeys = BodyKeys.concat(uuid);
    uuid++;
    this.setState({
      BodyKeys: nextKeys,
    });
  };

  handleRemoveParam = key => {
    const { ParamsKeys } = this.state;
    this.setState({
      ParamsKeys: ParamsKeys.filter(item => item !== key),
    });
  };

  handleRemoveBody = key => {
    const { BodyKeys } = this.state;
    this.setState({
      BodyKeys: BodyKeys.filter(item => item !== key),
    });
  };

  handleVisible = () => {
    this.setState({
      visible: !this.state.visible,
    });
  };

  render() {
    const { result, url, method, ParamsKeys, BodyKeys, visible } = this.state;

    return (
      <div>
        <Row>
          <Col lg={8} md={24}>
            <List
              className={styles.requestList}
              dataSource={requests}
              renderItem={item => (
                <List.Item
                  className={classnames(styles.listItem, {
                    [styles.lstItemActive]:
                      item.method === method && item.url === url,
                  })}
                  onClick={this.handleClickListItem.bind(this, item)}
                >
                  <span style={{ width: 72 }}>
                    <Tag
                      style={{ marginRight: 8 }}
                      color={methodTagColor[item.method]}
                    >
                      {item.method}
                    </Tag>
                  </span>
                  {item.url}
                </List.Item>
              )}
            />
          </Col>
          <Col lg={16} md={24}>
            <Row type="flex" justify="space-between">
              <InputGroup compact size="large" style={{ flex: 1 }}>
                <Select
                  size="large"
                  value={method}
                  style={{ width: 100 }}
                  onChange={this.handleSelectChange}
                >
                  {methods.map(item => (
                    <Option value={item} key={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
                <Input
                  value={url}
                  onChange={this.handleInputChange}
                  style={{ width: 'calc(100% - 200px)' }}
                />
                <Button
                  ghost={visible}
                  type={visible ? 'primary' : ''}
                  onClick={this.handleVisible}
                  size="large"
                >
                  Params
                </Button>
              </InputGroup>

              <Button
                size="large"
                type="primary"
                style={{ width: 100 }}
                onClick={this.handleRequest}
              >
                Send
              </Button>
            </Row>

            <Row justify="center">
              <Col span={12}>
                <Form ref={this.paramsForm} name="control-ref">
                  <div
                    className={classnames(styles.paramsBlock, {
                      [styles.hideParams]: !visible,
                    })}
                  >
                    {ParamsKeys.map((key, index) => (
                      <Row
                        gutter={8}
                        type="flex"
                        justify="start"
                        align="middle"
                        key={key}
                      >
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item
                            name={`check[${key}]`}
                            valuePropName="checked"
                          >
                            <Checkbox defaultChecked />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item name={`key[${key}]`}>
                            <Input placeholder="Key" />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item name={`value[${key}]`}>
                            <Input placeholder="Value" />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <CloseOutlined
                            onClick={this.handleRemoveParam.bind(this, key)}
                            style={{ cursor: 'pointer' }}
                          />
                        </Col>
                      </Row>
                    ))}

                    <Row style={{ marginTop: 8 }}>
                      <Button onClick={this.handleAddParam}>Add Param</Button>
                    </Row>
                  </div>
                </Form>
              </Col>

              <Col span={12}>
                <Form ref={this.bodyDataForm} name="control-ref">
                  <div
                    className={classnames(styles.paramsBlock, {
                      [styles.hideParams]: !visible,
                    })}
                  >
                    {BodyKeys.map((key, index) => (
                      <Row
                        gutter={8}
                        type="flex"
                        justify="start"
                        align="middle"
                        key={key}
                      >
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item
                            name={`check[${key}]`}
                            valuePropName="checked"
                          >
                            <Checkbox defaultChecked />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item name={`key[${key}]`}>
                            <Input placeholder="Key" />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <Form.Item name={`value[${key}]`}>
                            <Input placeholder="Value" />
                          </Form.Item>
                        </Col>
                        <Col style={{ marginTop: 8 }}>
                          <CloseOutlined
                            onClick={this.handleRemoveBody.bind(this, key)}
                            style={{ cursor: 'pointer' }}
                          />
                        </Col>
                      </Row>
                    ))}

                    <Row style={{ marginTop: 8 }}>
                      <Button onClick={this.handleAddBody}>
                        Add form-data
                      </Button>
                    </Row>
                  </div>
                </Form>
              </Col>
            </Row>

            <div className={styles.result}>{result}</div>
          </Col>
        </Row>
      </div>
    );
  }
}
