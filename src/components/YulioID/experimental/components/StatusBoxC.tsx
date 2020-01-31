var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as PropTypes from 'prop-types';
var react = require("react");
var antd = require("antd");
var yid_scss = require("../yid.scss");


var StatusBox = /** @class */ (function (_super) {
    __extends(StatusBox, _super);
    function StatusBox(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            Reactive: 'loading'
        };
        return _this;
    }
    StatusBox.prototype.componentDidMount = function () {
        var StateCode = this.props.StateCode;
        this.setState({ Reactive: StateCode });
    };
    StatusBox.prototype.render = function () {
        var Reactive = this.state.Reactive;
        if (Reactive == 'loading') {
            return (react.createElement("div", { className: yid_scss.spinner__wrapper, id: "loadingspn" },
                react.createElement("div", null,
                    react.createElement(antd.Icon, { type: "loading", style: { fontSize: 24, margin: '13px' }, spin: true })),
                react.createElement("div", null,
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("div", { style: { margin: 'auto' } },
                        react.createElement("h6", { className: yid_scss.h6lp, style: { textAlign: 'center', marginTop: '15%' } }, "Wait a sec...")))));
        }
        if (Reactive == '200') {
            return (react.createElement("div", { className: yid_scss.spinner__wrapper, id: "loadingspn" },
                react.createElement("div", null,
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("div", { style: { margin: 'auto' } },
                        react.createElement("h6", { className: yid_scss.h6lp, style: { textAlign: 'center', marginTop: '15%' } }, "SI")))));
        }
        if (Reactive == '400') {
            return (react.createElement("div", { className: yid_scss.spinner__wrapper, id: "loadingspn" },
                react.createElement("div", null,
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("br", null),
                    react.createElement("div", { style: { margin: 'auto' } },
                        react.createElement("h6", { className: yid_scss.h6lp, style: { textAlign: 'center', marginTop: '15%' } }, "NO")))));
        }
        return null;
    };
    return StatusBox;
}(react.Component));
StatusBox.PropTypes = {
    handleStatus: PropTypes.func,
    Loading: PropTypes.bool,
    StateCode: PropTypes.string
};
exports["default"] = StatusBox;
//# sourceMappingURL=StatusBoxC.js.map