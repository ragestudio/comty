import React from 'react';

const Background = ({ trackManifest, hasVideoSource }) => {
    if (!trackManifest || hasVideoSource) {
        return null;
    }

    return (
        <div className="lyrics-background-wrapper">
            <div className="lyrics-background-cover">
                <img
                    src={trackManifest.cover}
                    alt="Album cover"
                    loading="eager"
                    draggable={false}
                />
            </div>
        </div>
    );
};

export default React.memo(Background);