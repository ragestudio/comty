//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
const lodash = require("lodash")
const os = require("os")

const { cpu } = require("../lib")

const Logger = require("./lib/logger")
const RtmpServer = require("./servers/rtmp_server")
const TransServer = require("./servers/trans_server")
const RelayServer = require("./servers/relay_server")
const FissionServer = require("./servers/fission_server")

const context = require("./ctx")

class MediaServer {
  constructor(config) {
    this.config = config
    this.context = context
  }

  run() {
    Logger.setLogType(this.config.logType)

    if (this.config.rtmp) {
      this.nrs = new RtmpServer(this.config)
      this.nrs.run()
    }

    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log("TransServer does not work in cluster mode")
      } else {
        this.nts = new TransServer(this.config)
        this.nts.run()
      }
    }

    if (this.config.relay) {
      if (this.config.cluster) {
        Logger.log("RelayServer does not work in cluster mode")
      } else {
        this.nls = new RelayServer(this.config)
        this.nls.run()
      }
    }

    if (this.config.fission) {
      if (this.config.cluster) {
        Logger.log("FissionServer does not work in cluster mode")
      } else {
        this.nfs = new FissionServer(this.config)
        this.nfs.run()
      }
    }

    process.on("uncaughtException", function (err) {
      Logger.error("uncaughtException", err)
    })

    process.on("SIGINT", function () {
      process.exit()
    })
  }

  on = (eventName, listener) => {
    context.nodeEvent.on(eventName, listener)
  }

  stop = () => {
    if (this.nrs) {
      this.nrs.stop()
    }
    if (this.nhs) {
      this.nhs.stop()
    }
    if (this.nls) {
      this.nls.stop()
    }
    if (this.nfs) {
      this.nfs.stop()
    }
  }

  getSession = (id) => {
    return context.sessions.get(id)
  }

  getSessions = () => {
    let stats = {};

    this.context.sessions.forEach(function (session, id) {
      if (session.isStarting) {
        let regRes = /\/(.*)\/(.*)/gi.exec(session.publishStreamPath || session.playStreamPath)

        if (regRes === null) {
          return
        }

        let [app, stream] = lodash.slice(regRes, 1)

        if (!lodash.get(stats, [app, stream])) {
          lodash.setWith(stats, [app, stream], {
            publisher: null,
            subscribers: []
          }, Object)
        }

        switch (true) {
          case session.isPublishing: {
            lodash.setWith(stats, [app, stream, "publisher"], {
              app: app,
              stream: stream,
              clientId: session.id,
              connectCreated: session.connectTime,
              bytes: session.socket.bytesRead,
              ip: session.socket.remoteAddress,
              audio: session.audioCodec > 0 ? {
                codec: session.audioCodecName,
                profile: session.audioProfileName,
                samplerate: session.audioSamplerate,
                channels: session.audioChannels
              } : null,
              video: session.videoCodec > 0 ? {
                codec: session.videoCodecName,
                width: session.videoWidth,
                height: session.videoHeight,
                profile: session.videoProfileName,
                level: session.videoLevel,
                fps: session.videoFps
              } : null,
            }, Object)
            break;
          }
          case !!session.playStreamPath: {
            switch (session.constructor.name) {
              case "NodeRtmpSession": {
                stats[app][stream]["subscribers"].push({
                  app: app,
                  stream: stream,
                  clientId: session.id,
                  connectCreated: session.connectTime,
                  bytes: session.socket.bytesWritten,
                  ip: session.socket.remoteAddress,
                  protocol: "rtmp"
                })

                break
              }
              case "NodeFlvSession": {
                stats[app][stream]["subscribers"].push({
                  app: app,
                  stream: stream,
                  clientId: session.id,
                  connectCreated: session.connectTime,
                  bytes: session.req.connection.bytesWritten,
                  ip: session.req.connection.remoteAddress,
                  protocol: session.TAG === "websocket-flv" ? "ws" : "http"
                })

                break
              }
            }

            break
          }
        }
      }
    })

    return stats
  }

  getSessionsInfo = () => {
    let info = {
      inbytes: 0,
      outbytes: 0,
      rtmp: 0,
      http: 0,
      ws: 0,
    }

    for (let session of this.context.sessions.values()) {
      if (session.TAG === "relay") {
        continue
      }

      let socket = session.TAG === "rtmp" ? session.socket : session.req.socket

      info.inbytes += socket.bytesRead
      info.outbytes += socket.bytesWritten
      info.rtmp += session.TAG === "rtmp" ? 1 : 0
      info.http += session.TAG === "http-flv" ? 1 : 0
      info.ws += session.TAG === "websocket-flv" ? 1 : 0
    }

    return info
  }

  getServerStatus = async () => {
    const cpuPercentageUsage = await cpu.percentageUsage()
    const sessionsInfo = this.getSessionsInfo()

    return {
      os: {
        arch: os.arch(),
        platform: os.platform(),
        release: os.release(),
      },
      cpu: {
        num: os.cpus().length,
        load: cpuPercentageUsage,
        model: os.cpus()[0].model,
        speed: os.cpus()[0].speed,
      },
      net: {
        inbytes: this.context.stat.inbytes + sessionsInfo.inbytes,
        outbytes: this.context.stat.outbytes + sessionsInfo.outbytes,
      },
      mem: {
        totle: os.totalmem(),
        free: os.freemem()
      },
      nodejs: {
        uptime: Math.floor(process.uptime()),
        version: process.version,
        mem: process.memoryUsage()
      },
    }
  }
}

module.exports = MediaServer