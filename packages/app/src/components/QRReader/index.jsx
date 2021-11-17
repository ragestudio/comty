import React from "react"
import QrReader from "react-qr-reader"
import { Window } from "components"

export class Reader extends React.Component {
	state = {
		delay: 100,
		result: "No result",
	}
	qrReaderRef = React.createRef()

	handleScan = (data) => {
		this.setState({
			result: data,
		})
	}

	handleError = (err) => {
		console.error(err)
	}

	openImageDialog = () => {
		this.qrReaderRef.current.openImageDialog()
	}

	render() {
		const previewStyle = {
			height: 240,
			width: 320,
		}

		return (
			<div>
				<input type="button" value="Submit QR Code" onClick={this.openImageDialog} />
                <p>{this.state.result}</p>

				<QrReader
					ref={this.qrReaderRef}
					delay={this.state.delay}
					style={previewStyle}
					onError={this.handleError}
					onScan={this.handleScan}
					legacyMode
				/>
			</div>
		)
	}
}

export function openModal() {
	new Window.DOMWindow({ id: "QRScanner", children: Reader }).create()
}
