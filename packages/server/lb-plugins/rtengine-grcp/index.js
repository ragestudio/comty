import grpc from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"

export default class RTEngineGRPCAdapter {
	constructor(server) {
		this.server = server
	}

	grpcServer = null

	protos = {}

	async initialize() {
		console.log("hollool from rtengine grpc adapter plugin")

		// create the grpc server
		//this.grpcServer = new grpc.Server()
	}

	async incoming(call, callback) {}

	async outgoing(call, callback) {}
}
