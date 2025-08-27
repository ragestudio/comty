"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForNewNode = exports.getOutputNodesName = exports.getInputNodesName = exports.unlinkPorts = exports.linkPorts = exports.unlinkNodesNameToId = exports.linkNodesNameToId = exports.getInputNodes = exports.getOutputNodes = exports.getNodes = exports.getPorts = exports.getLinks = exports.closePwThread = exports.createPwThread = void 0;
const library = require("./index.node");
function createPwThread(enableDebug) {
    library.createPwThread(enableDebug !== null && enableDebug !== void 0 ? enableDebug : false);
}
exports.createPwThread = createPwThread;
function closePwThread() {
    return library.closePwThread();
}
exports.closePwThread = closePwThread;
function getLinks() {
    const temp = library.getLinks();
    return temp.filter((link) => link.id);
}
exports.getLinks = getLinks;
function getPorts() {
    const temp = library.getPorts();
    return temp.filter((port) => port.id);
}
exports.getPorts = getPorts;
function getNodes() {
    const temp = library.getNodes();
    return temp.filter((node) => node.id);
}
exports.getNodes = getNodes;
function getOutputNodes() {
    const temp = library.getOutputNodes();
    return temp.filter((output) => output.id);
}
exports.getOutputNodes = getOutputNodes;
function getInputNodes() {
    const temp = library.getInputNodes();
    return temp.filter((input) => input.id);
}
exports.getInputNodes = getInputNodes;
function linkNodesNameToId(nodeName, nodeId) {
    library.linkNodesNameToId(nodeName, nodeId);
}
exports.linkNodesNameToId = linkNodesNameToId;
function unlinkNodesNameToId(nodeName, nodeId) {
    library.unlinkNodesNameToId(nodeName, nodeId);
}
exports.unlinkNodesNameToId = unlinkNodesNameToId;
function linkPorts(inputPortId, outputPortId) {
    library.linkPorts(inputPortId, outputPortId);
}
exports.linkPorts = linkPorts;
function unlinkPorts(inputPortId, outputPortId) {
    library.unlinkPorts(inputPortId, outputPortId);
}
exports.unlinkPorts = unlinkPorts;
function getInputNodesName() {
    return getInputNodes().map((input) => input.name);
}
exports.getInputNodesName = getInputNodesName;
function getOutputNodesName() {
    return getOutputNodes().map((output) => output.name);
}
exports.getOutputNodesName = getOutputNodesName;
function waitForNewNode(nodeName, direction, timeout) {
    return library.waitForNewNode(nodeName, direction !== null && direction !== void 0 ? direction : "Both", timeout !== null && timeout !== void 0 ? timeout : 5000);
}
exports.waitForNewNode = waitForNewNode;
//# sourceMappingURL=index.js.map