"use strict";

function e(e) {
  return e && "object" == typeof e && "default" in e ? e.default : e
}
Object.defineProperty(exports, "__esModule", {
  value: !0
});
var t = e(require("react")),
  n = e(require("plyr"));

function o(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
}

function i(e, t) {
  for (var n = 0; n < t.length; n++) {
    var o = t[n];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, o.key, o)
  }
}

function r(e) {
  return (r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
    return typeof e
  } : function (e) {
    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
  })(e)
}

function c(e) {
  return (c = "function" == typeof Symbol && "symbol" === r(Symbol.iterator) ? function (e) {
    return r(e)
  } : function (e) {
    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : r(e)
  })(e)
}

function s(e, t) {
  return !t || "object" !== c(t) && "function" != typeof t ? function (e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e
  }(e) : t
}

function a(e) {
  return (a = Object.setPrototypeOf ? Object.getPrototypeOf : function (e) {
    return e.__proto__ || Object.getPrototypeOf(e)
  })(e)
}

function l(e, t) {
  return (l = Object.setPrototypeOf || function (e, t) {
    return e.__proto__ = t, e
  })(e, t)
}
require("plyr/dist/plyr.css");
! function (e, t) {
  void 0 === t && (t = {});
  var n = t.insertAt;
  if (e && "undefined" != typeof document) {
    var o = document.head || document.getElementsByTagName("head")[0],
      i = document.createElement("style");
    i.type = "text/css", "top" === n && o.firstChild ? o.insertBefore(i, o.firstChild) : o.appendChild(i), i.styleSheet ? i.styleSheet.cssText = e : i.appendChild(document.createTextNode(e))
  }
}('.yjs-plyr{width: 100%!important;position:relative;background-color:#4caf50;border:none;font-size:28px;color:#fff;padding:20px;width:200px;text-align:center;-webkit-transition-duration:.4s;transition-duration:.4s;text-decoration:none;overflow:hidden;cursor:pointer;box-shadow:0 8px 16px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19)}.PlyrComponent:after{content:"";background:#f1f1f1;display:block;position:absolute;padding-top:300%;padding-left:350%;margin-left:-20px!important;margin-top:-120%;opacity:0;transition:all .8s}.PlyrComponent:active:after{padding:0;margin:0;opacity:1;transition:0s}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0eWxlcy5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZUFDRSxpQkFBa0IsQ0FDbEIsd0JBQXlCLENBQ3pCLFdBQVksQ0FDWixjQUFlLENBQ2YsVUFBYyxDQUNkLFlBQWEsQ0FDYixXQUFZLENBQ1osaUJBQWtCLENBQ2xCLCtCQUFpQyxDQUNqQyx1QkFBeUIsQ0FDekIsb0JBQXFCLENBQ3JCLGVBQWdCLENBQ2hCLGNBQWUsQ0FDZixtRUFDRixDQUVBLHFCQUNFLFVBQVcsQ0FDWCxrQkFBbUIsQ0FDbkIsYUFBYyxDQUNkLGlCQUFrQixDQUNsQixnQkFBaUIsQ0FDakIsaUJBQWtCLENBQ2xCLDJCQUE2QixDQUM3QixnQkFBaUIsQ0FDakIsU0FBVSxDQUNWLGtCQUNGLENBRUEsNEJBQ0UsU0FBVSxDQUNWLFFBQVMsQ0FDVCxTQUFVLENBQ1YsYUFDRiIsImZpbGUiOiJzdHlsZXMuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLlBseXJDb21wb25lbnQge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGJhY2tncm91bmQtY29sb3I6ICM0Q0FGNTA7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC1zaXplOiAyOHB4O1xuICBjb2xvcjogI0ZGRkZGRjtcbiAgcGFkZGluZzogMjBweDtcbiAgd2lkdGg6IDIwMHB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIC13ZWJraXQtdHJhbnNpdGlvbi1kdXJhdGlvbjogMC40czsgLyogU2FmYXJpICovXG4gIHRyYW5zaXRpb24tZHVyYXRpb246IDAuNHM7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBib3gtc2hhZG93OiAwIDhweCAxNnB4IDAgcmdiYSgwLDAsMCwwLjIpLCAwIDZweCAyMHB4IDAgcmdiYSgwLDAsMCwwLjE5KTtcbn1cblxuLlBseXJDb21wb25lbnQ6YWZ0ZXIge1xuICBjb250ZW50OiBcIlwiO1xuICBiYWNrZ3JvdW5kOiAjZjFmMWYxO1xuICBkaXNwbGF5OiBibG9jaztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBwYWRkaW5nLXRvcDogMzAwJTtcbiAgcGFkZGluZy1sZWZ0OiAzNTAlO1xuICBtYXJnaW4tbGVmdDogLTIwcHggIWltcG9ydGFudDtcbiAgbWFyZ2luLXRvcDogLTEyMCU7XG4gIG9wYWNpdHk6IDA7XG4gIHRyYW5zaXRpb246IGFsbCAwLjhzXG59XG5cbi5QbHlyQ29tcG9uZW50OmFjdGl2ZTphZnRlciB7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMDtcbiAgb3BhY2l0eTogMTtcbiAgdHJhbnNpdGlvbjogMHNcbn1cbiJdfQ== */');
var u = function (e) {
  function r() {
    return o(this, r), s(this, a(r).apply(this, arguments))
  }
  var c, u, p;
  return function (e, t) {
    if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
    e.prototype = Object.create(t && t.prototype, {
      constructor: {
        value: e,
        writable: !0,
        configurable: !0
      }
    }), t && l(e, t)
  }(r, t.Component), c = r, (u = [{
    key: "componentDidMount",
    value: function () {
      this.player = new n(".yjs-plyr", this.props.options), this.player.source = this.props.sources
    }
  }, {
    key: "componentWillUnmount",
    value: function () {
      this.player.destroy()
    }
  }, {
    key: "render",
    value: function () {
      return t.createElement("video", {
        className: "yjs-plyr plyr"
      })
    }
  }]) && i(c.prototype, u), p && i(c, p), r
}();
u.defaultProps = {
  options: {
    controls: ["rewind", "play", "fast-forward", "progress", "current-time", "duration", "mute", "volume", "settings", "fullscreen"],
    i18n: {
      restart: "Restart",
      rewind: "Rewind {seektime}s",
      play: "Play",
      pause: "Pause",
      fastForward: "Forward {seektime}s",
      seek: "Seek",
      seekLabel: "{currentTime} of {duration}",
      played: "Played",
      buffered: "Buffered",
      currentTime: "Current time",
      duration: "Duration",
      volume: "Volume",
      mute: "Mute",
      unmute: "Unmute",
      enableCaptions: "Enable captions",
      disableCaptions: "Disable captions",
      download: "Download",
      enterFullscreen: "Enter fullscreen",
      exitFullscreen: "Exit fullscreen",
      frameTitle: "Player for {title}",
      captions: "Captions",
      settings: "Settings",
      menuBack: "Go back to previous menu",
      speed: "Speed",
      normal: "Normal",
      quality: "Quality",
      loop: "Loop"
    }
  },

}, exports.PlyrComponent = u;