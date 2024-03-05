export default (value) => {
    // convert seek to minutes and seconds
    const minutes = Math.floor(value / 60)

    // add leading zero if minutes is less than 10
    const minutesString = minutes < 10 ? `0${minutes}` : minutes

    // get seconds
    const seconds = Math.floor(value - minutes * 60)

    // add leading zero if seconds is less than 10
    const secondsString = seconds < 10 ? `0${seconds}` : seconds

    return `${minutesString}:${secondsString}`
}