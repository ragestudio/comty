import React, { useState } from "react"
import { Button, Card, List, Typography, Space, Divider, notification } from "antd"
import QueueManager from "@cores/player/classes/QueueManager"

const { Title, Text } = Typography

const QueueDebugger = () => {
    const queueManager = React.useRef(new QueueManager())

    const [current, setCurrent] = useState(queueManager.current.currentItem)
    const [prevItems, setPrevItems] = useState([...queueManager.current.prevItems])
    const [nextItems, setNextItems] = useState([...queueManager.current.nextItems])

    const updateQueueState = () => {
        setCurrent(queueManager.current.currentItem)
        setPrevItems([...queueManager.current.prevItems])
        setNextItems([...queueManager.current.nextItems])
    }

    const handleNext = (random = false) => {
        queueManager.current.next(random)
        updateQueueState()
    }

    const handlePrevious = () => {
        queueManager.current.previous()
        updateQueueState()
    }

    const handleSet = (item) => {
        try {
            queueManager.current.set(item)
            updateQueueState()
        } catch (error) {
            notification.error({
                message: "Error",
                description: error.message,
                placement: "bottomRight",
            })
        }
    }

    const handleAdd = () => {
        const newItem = {
            id: (nextItems.length + prevItems.length + 2).toString(),
            name: `Item ${nextItems.length + prevItems.length + 2}`
        }
        queueManager.current.add(newItem)
        updateQueueState()
    }

    const handleRemove = (item) => {
        queueManager.current.remove(item)
        updateQueueState()
    }

    React.useEffect(() => {
        queueManager.current.add({ id: "1", name: "Item 1" })
        queueManager.current.add({ id: "2", name: "Item 2" })
        queueManager.current.add({ id: "3", name: "Item 3" })
        queueManager.current.add({ id: "4", name: "Item 4" })

        updateQueueState()
    }, [])

    return (
        <Space direction="vertical" size="large" style={{ width: "100%", padding: "20px" }}>
            <Title level={2}>Queue Debugger</Title>
            <Card title="Current Item">
                <Text>{current ? current.name : "None"}</Text>
            </Card>
            <Divider />
            <Card title="Previous Items">
                <List
                    bordered
                    dataSource={prevItems}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button type="link" onClick={() => handleSet(item)}>Set</Button>,
                            ]}
                        >
                            {item.name}
                        </List.Item>
                    )}
                />
            </Card>
            <Card title="Next Items">
                <List
                    bordered
                    dataSource={nextItems}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button type="link" onClick={() => handleSet(item)}>Set</Button>,
                                <Button type="link" danger onClick={() => handleRemove(item)}>Remove</Button>,
                            ]}
                        >
                            {item.name}
                        </List.Item>
                    )}
                />
            </Card>
            <Divider />
            <Space>
                <Button onClick={handlePrevious}>Previous</Button>
                <Button onClick={() => handleNext(false)}>Next</Button>
                <Button onClick={() => handleNext(true)}>Next (Random)</Button>
                <Button type="primary" onClick={handleAdd}>Add Item</Button>
            </Space>
        </Space>
    )
}

export default QueueDebugger
