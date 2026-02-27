import React, { useState, useEffect } from 'react';
import GlitchText from '../GlitchText';

export const NostargiaIntro = () => {
    const [visible, setVisible] = useState(true);
    const [opacity, setOpacity] = useState(0); // Start unseen for fade-in

    useEffect(() => {
        // Trigger fade-in right after mount
        const fadeInTimer = setTimeout(() => {
            setOpacity(1);
        }, 500); // Small delay to ensure CSS transition applies
        // Start fading out at 2 seconds (gives more time for reading "Into the sky")
        const fadeTimer = setTimeout(() => {
            setOpacity(0);
        }, 2000);

        // Unmount at 3 seconds
        const removeTimer = setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 50,
                opacity: opacity,
                transition: 'opacity 1s ease-in-out',
                // Optional tracking adjustment for cooler title look
                letterSpacing: '0.2em'
            }}
        >
            <GlitchText speed={1.2} enableShadows={true} enableOnHover={false}>
                Nostargia
            </GlitchText>
        </div>
    );
};
