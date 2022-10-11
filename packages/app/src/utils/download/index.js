export default (uri, filename) => {
    fetch(uri, {
        method: "GET",
        headers: {
            "Content-Type": "application/pdf",
        },
    })
        .then((response) => response.blob())
        .then((blob) => {
            if (!filename) {
                filename = uri.split("/").pop()
            }

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([blob]))

            const link = document.createElement("a")

            link.href = url

            link.setAttribute("download", filename)

            // Append to html link element page
            document.body.appendChild(link)

            // Start download
            link.click()

            // Clean up and remove the link
            link.parentNode.removeChild(link)
        })
}