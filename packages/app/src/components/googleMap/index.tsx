import React from 'react'

const Marker = ({ text }) => <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "auto", height: "auto", fontSize: "17px", color: "#333333" }}>
    <div style={{ backgroundColor: "rgba(66, 117, 245, 0.4)", height: '35px', width: "35px", borderRadius: "24px" }} />
</div>

export default (props) => {
    if (typeof(props.size) == "undefined") {
        props.size = "420px"
    }
    return <div style={{ height: props.size, width: props.size }}>
        <iframe 
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${props.lat},${props.lng}&z=16&output=embed`} 
            height="100%" 
            width="100%"
        />
    </div>
}