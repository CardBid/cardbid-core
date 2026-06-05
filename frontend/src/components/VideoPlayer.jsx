import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

/**
 * VideoPlayer
 *
 * Odporna wersja:
 *  - Nie inicjalizuje video.js dopoki playlista HLS nie zwroci 200.
 *  - Cicho sonduje URL co `pollIntervalMs` (domyslnie 5s) gdy transmisji nie ma.
 *  - Gdy player juz dziala i poleci blad sieciowy (kod 2/4), nie spamuje konsoli -
 *    przechodzi w tryb "Oczekiwanie..." i wraca do trybu polling.
 *  - Czysci wszystko przy unmount (player, interval, AbortController).
 */
export const VideoPlayer = (props) => {
  const { options, onReady, pollIntervalMs = 5000 } = props;

  const placeholderRef = useRef(null);
  const playerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  const initPlayerRef = useRef(null);
  const startPollingRef = useRef(null);
  const stopPollingRef = useRef(null);

  const [streamState, setStreamState] = useState('checking');

  const sourceUrl = options?.sources?.[0]?.src;

  const probeStream = useCallback(async () => {
    if (!sourceUrl) return false;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(sourceUrl, { method: 'GET', signal: controller.signal, cache: 'no-store' });
      return res.ok;
    } catch (err) {
      console.warn("[VideoPlayer] Błąd łączenia z wideo (CORS?):", err);
      return false;
    }
  }, [sourceUrl]);

  const initPlayer = useCallback(() => {
    if (!placeholderRef.current || playerRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'w-full', 'h-full', 'vjs-default-skin', 'object-cover');
    placeholderRef.current.appendChild(videoElement);

    const player = videojs(videoElement, options, () => {
      if (!mountedRef.current) return;
      onReady && onReady(player);
    });
    playerRef.current = player;

    player.on('error', () => {
      const error = player.error();
      if (!error) return;
      if (error.code === 2 || error.code === 4) {
        try { player.error(null); player.reset(); } catch { /* noop */ }
        if (mountedRef.current) {
          setStreamState('offline');
          if (startPollingRef.current) startPollingRef.current();
        }
      } else {
        console.warn('[VideoPlayer] blad:', error);
        if (mountedRef.current) setStreamState('error');
      }
    });
  }, [options, onReady]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    const tick = async () => {
      const ok = await probeStream();
      if (!mountedRef.current) return;
      if (ok) {
        if (stopPollingRef.current) stopPollingRef.current();
        setStreamState('live');
        if (!playerRef.current) {
          if (initPlayerRef.current) initPlayerRef.current();
        } else {
          try {
            playerRef.current.src(options.sources);
            playerRef.current.load();
            playerRef.current.play().catch(() => {});
          } catch { /* noop */ }
        }
      } else {
        setStreamState('offline');
      }
    };
    tick();
    pollTimerRef.current = setInterval(tick, pollIntervalMs);
  }, [probeStream, options, pollIntervalMs]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => { initPlayerRef.current = initPlayer; }, [initPlayer]);
  useEffect(() => { startPollingRef.current = startPolling; }, [startPolling]);
  useEffect(() => { stopPollingRef.current = stopPolling; }, [stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    startPolling();
    return () => {
      mountedRef.current = false;
      stopPolling();
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        try { player.dispose(); } catch { /* noop */ }
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    if (!options?.sources) return;
    const currentSrc = player.src();
    const newSrc = options.sources[0].src;
    if (currentSrc !== newSrc) player.src(options.sources);
    if (typeof options.autoplay !== 'undefined') player.autoplay(options.autoplay);
  }, [options]);

  return (
    <div data-vjs-player className="w-full h-full relative">
      <div ref={placeholderRef} className="w-full h-full absolute inset-0" />
      {streamState !== 'live' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 text-gray-300 pointer-events-none select-none">
          {streamState === 'checking' && (
            <>
              <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-3" />
              <p className="text-xs uppercase tracking-widest font-bold">Checking stream...</p>
            </>
          )}
          {streamState === 'offline' && (
            <>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">No stream</p>
              <p className="text-[10px] text-gray-500 mt-1 tracking-wider">
                Retrying in {Math.round(pollIntervalMs / 1000)}s
              </p>
            </>
          )}
          {streamState === 'error' && (
            <>
              <p className="text-sm font-bold uppercase tracking-widest text-red-400">Player error</p>
              <p className="text-[10px] text-gray-500 mt-1 tracking-wider">Try refreshing the page</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
