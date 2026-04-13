import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export const VideoPlayer = (props) => {
  const placeholderRef = useRef(null); 
  const playerRef = useRef(null);
  const { options, onReady } = props;

  useEffect(() => {
    if (!placeholderRef.current) return;

    if (!playerRef.current) {
      
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'w-full', 'h-full', 'vjs-default-skin', 'object-cover');
      placeholderRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        console.log('Odtwarzacz jest gotowy i osadzony w DOM!');
        onReady && onReady(player);
      });

      player.on('error', () => {
        const error = player.error();
        console.warn('Błąd odtwarzacza:', error);

        if (error && error.code === 4) {
          console.log('Próba ponownego połączenia...');
          setTimeout(() => {
            player.src(options.sources);
            player.load();
            player.play().catch(() => {});
          }, 3000);
        }
      });

    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className="w-full h-full relative">
      <div ref={placeholderRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VideoPlayer;