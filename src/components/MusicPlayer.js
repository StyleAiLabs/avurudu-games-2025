import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        // Initialize audio but don't play yet
        audioRef.current = new Audio('/music/background-music.mp3');
        audioRef.current.loop = true;
        audioRef.current.load();
        setAudioReady(true);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleMusic = async () => {
        if (!audioRef.current) return;

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error toggling audio:', error);
        }
    };

    return (
        <button
            onClick={toggleMusic}
            className="fixed bottom-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors duration-200 z-50"
            title={isPlaying ? 'Mute music' : 'Play music'}
        >
            {isPlaying ? (
                <Volume2 className="h-6 w-6 text-orange-600" />
            ) : (
                <Play className="h-6 w-6 text-orange-600" />
            )}
        </button>
    );
};

export default MusicPlayer;