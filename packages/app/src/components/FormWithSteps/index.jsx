import React from "react"
import { Button, Alert } from "antd"

import "./index.less"

const FormWithSteps = (props) => {
	const { steps, header, onCancel, onFinish, cancelable } = props

	const [step, setStep] = React.useState(0)
	const [values, setValues] = React.useState({})
	const [error, setError] = React.useState(null)

	function updateState(key, value) {
		setValues((prevValues) => ({ ...prevValues, [key]: value }))
	}

	function previousStep() {
		if (step === 0) {
			if (!cancelable) {
				return false
			}

			if (typeof onCancel === "function") {
				onCancel()
			}
		}

		setStep((prev) => {
			if (step === 0) {
				return prev
			}

			return prev - 1
		})
	}

	async function nextStep() {
		if (!canNext()) {
			return false
		}

		if (step === steps.length - 1) {
			return await onFinish({
				values,
				updateState,
				setError,
			})
		}

		if (typeof steps[step].onNext === "function") {
			const result = await steps[step].onNext({
				values,
				updateState,
				setError,
			})

			if (result) {
				if (result.cancel === true) {
					return false
				}
			}
		}

		setStep((prev) => {
			if (step === steps.length - 1) {
				return prev
			}

			return prev + 1
		})

		setError(null)
	}

	function canNext() {
		if (typeof steps[step].validate === "function") {
			return steps[step].validate(values)
		}

		return true
	}

	return (
		<div className="steped-form">
			{typeof header === "function" &&
				header({
					step: step,
				})}

			<div className="steped-form-content">
				{steps[step].render({
					updateState: updateState,
					values: values,
				})}

				{error && <Alert message={error} type="error" />}

				<div className="steped-form-content-actions">
					<Button onClick={previousStep}>
						{step === 0 && cancelable ? "Cancel" : "Back"}
					</Button>

					<Button onClick={nextStep} disabled={!canNext()}>
						{step === steps.length - 1 ? "Finish" : "Next"}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default FormWithSteps
