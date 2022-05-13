const fs = require("fs")
const loadash = require("lodash")
const mkdirp = require("mkdirp")

const Logger = require("../lib/logger")
const FissionSession = require("../sessionsModels/fission_session")
const { getFFmpegVersion, getFFmpegUrl } = require("../lib/utils")

const context = require("../ctx")

class NodeFissionServer {
  constructor(config) {
    this.config = config
    this.fissionSessions = new Map()
  }

  async run() {
    try {
      mkdirp.sync(this.config.mediaroot)
      fs.accessSync(this.config.mediaroot, fs.constants.W_OK)
    } catch (error) {
      Logger.error(`Node Media Fission Server startup failed. MediaRoot:${this.config.mediaroot} cannot be written.`)
      return
    }

    try {
      fs.accessSync(this.config.fission.ffmpeg, fs.constants.X_OK)
    } catch (error) {
      Logger.error(`Node Media Fission Server startup failed. ffmpeg:${this.config.fission.ffmpeg} cannot be executed.`)
      return
    }

    let version = await getFFmpegVersion(this.config.fission.ffmpeg)

    if (version === "" || parseInt(version.split(".")[0]) < 4) {
      Logger.error("Node Media Fission Server startup failed. ffmpeg requires version 4.0.0 above")
      Logger.error("Download the latest ffmpeg static program:", getFFmpegUrl())
      return
    }

    context.nodeEvent.on("postPublish", this.onPostPublish.bind(this))
    context.nodeEvent.on("donePublish", this.onDonePublish.bind(this))

    Logger.log(`Node Media Fission Server started, MediaRoot: ${this.config.mediaroot}, ffmpeg version: ${version}`)
  }

  async onPostPublish(id, streamPath, args) {
    const fixedStreamingKey = streamPath.split("/").pop()
    const userspace = await global.resolveUserspaceOfStreamingKey(fixedStreamingKey)

    if (!userspace) {
      console.error("No userspace found for streaming key:", fixedStreamingKey)
      return false
    }

    let regRes = /\/(.*)\/(.*)/gi.exec(streamPath)
    let [app, name] = loadash.slice(regRes, 1)

    for (let task of this.config.fission.tasks) {
      regRes = /(.*)\/(.*)/gi.exec(task.rule)
      let [ruleApp, ruleName] = loadash.slice(regRes, 1)

      if ((app === ruleApp || ruleApp === "*") && (name === ruleName || ruleName === "*")) {
        let s = context.sessions.get(id)

        if (s.isLocal && name.split("_")[1]) {
          continue
        }

        let conf = task

        conf.ffmpeg = this.config.fission.ffmpeg
        conf.mediaroot = this.config.mediaroot
        conf.rtmpPort = this.config.rtmp.port
        conf.streamPath = streamPath
        conf.streamApp = app
        conf.streamName = name
        conf.fixedStreamName = userspace.username
        conf.args = args

        let session = new FissionSession(conf)

        this.fissionSessions.set(id, session)

        session.on("end", () => {
          this.fissionSessions.delete(id)
        })

        session.run()
      }
    }
  }

  onDonePublish(id, streamPath, args) {
    let session = this.fissionSessions.get(id)

    if (session) {
      session.end()
    }
  }
}

module.exports = NodeFissionServer
