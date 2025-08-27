import NodePipewireLib from "./lib/index.cjs"

function filterByNodeType(nodes, type) {
	return nodes.filter((node) => {
		if (node.node_type.toLowerCase() !== type.toLowerCase()) {
			return false
		}

		return true
	})
}

export default class Pipewire {
	constructor() {
		console.log("Starting Pipewire thread module")
		NodePipewireLib.createPwThread()
	}

	async destroy() {
		await NodePipewireLib.closePwThread()
	}

	getLinks = NodePipewireLib.getLinks
	getPorts = NodePipewireLib.getPorts
	getNodes = NodePipewireLib.getNodes
	getOutputNodes = NodePipewireLib.getOutputNodes
	getInputNodes = NodePipewireLib.getInputNodes

	linkNodesNameToId = NodePipewireLib.linkNodesNameToId
	unlinkNodesNameToId = NodePipewireLib.unlinkNodesNameToId

	linkPorts = NodePipewireLib.linkPorts
	unlinkPorts = NodePipewireLib.unlinkPorts

	waitForNewNode = NodePipewireLib.waitForNewNode

	getNodeByName = async (name) => {
		const nodes = await this.getNodes()
		return nodes.find((node) => node.name === name)
	}

	getNodeById = async (id) => {
		const nodes = await this.getNodes()
		return nodes.find((node) => node.id.toString() === id.toString())
	}

	getInputNodeByName = async (name) => {
		const nodes = await this.getInputNodes()
		return nodes.find((node) => node.name === name)
	}

	getOutputNodeByName = async (name) => {
		const nodes = await this.getOutputNodes()
		return nodes.find((node) => node.name === name)
	}

	getLinkedAudioNodesOfSink = async (sinkName) => {
		let sources = []

		let inputNodes = filterByNodeType(await this.getInputNodes(), "audio")

		const sinkNode = inputNodes.find((node) => node.name === sinkName)

		if (!sinkNode) {
			throw new Error(`Sink node [${sinkName}] not found`)
		}

		let outputNodes = filterByNodeType(await this.getOutputNodes(), "audio")
		let links = await this.getLinks()

		// get only links with target to sinknode
		links = links.filter((link) => {
			return link.input_node_id === sinkNode.id
		})

		// remove duplicate links (due multiple links can be created for every channel eg. stereo)
		links = links.reduce((acc, link) => {
			if (!acc.find((l) => l.output_node_id === link.output_node_id)) {
				acc.push(link)
			}

			return acc
		}, [])

		for (const link of links) {
			const source = outputNodes.find(
				(node) => node.id === link.output_node_id,
			)

			if (source) {
				sources.push(source)
			}
		}

		return sources
	}
}
