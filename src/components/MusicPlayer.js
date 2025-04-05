import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio('/music/background-music.mp3');
        audioRef.current.loop = true;

        const playMusic = async () => {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (error) {
                console.log('Autoplay failed:', error);
                setIsPlaying(false);
            }
        };

        playMusic();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleMusic = async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
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
                <VolumeX className="h-6 w-6 text-gray-600" />
            )}
        </button>
    );
};

export default MusicPlayer;