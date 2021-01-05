const zeroStyles = (element: HTMLElement, ...properties: string[]): void => {
  for (const property of properties) {
    element.style.setProperty(property, '0')
  }
}

const removeElement = (element: HTMLElement): void => {
  element.parentNode!.removeChild(element)
}

const createTextArea = (): HTMLTextAreaElement => {
  const textArea: HTMLTextAreaElement = document.createElement('textarea')
  textArea.setAttribute('cols', '0')
  textArea.setAttribute('rows', '0')
  zeroStyles(textArea,
    'border-width',
    'bottom',
    'margin-left', 'margin-top',
    'outline-width',
    'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
    'right',
  )
  textArea.style.setProperty('box-sizing', 'border-box')
  textArea.style.setProperty('height', '1px')
  textArea.style.setProperty('margin-bottom', '-1px')
  textArea.style.setProperty('margin-right', '-1px')
  textArea.style.setProperty('max-height', '1px')
  textArea.style.setProperty('max-width', '1px')
  textArea.style.setProperty('min-height', '1px')
  textArea.style.setProperty('min-width', '1px')
  textArea.style.setProperty('outline-color', 'transparent')
  textArea.style.setProperty('position', 'absolute')
  textArea.style.setProperty('width', '1px')
  document.body.appendChild(textArea)
  return textArea;
}

export const clipboard = {
  copyText: (data:String) => {
    if (typeof (data) !== "string") {
      return false
    }
    const textArea: HTMLTextAreaElement = createTextArea()
    textArea.value = data
    textArea.select()
    const success: boolean = document.execCommand('copy')
    removeElement(textArea)
    if (!success) {
      return false
    }
  },
  readText: (data:String) => {
    if (typeof (data) !== "string") {
      return false
    }
    const textArea: HTMLTextAreaElement = createTextArea()
    textArea.focus()
    const success: boolean = document.execCommand('paste')

    if (!success) {
      removeElement(textArea)
      return false
    }
    const value: string = textArea.value
    removeElement(textArea)
    return value
  }
}