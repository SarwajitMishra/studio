
'use client';

import { useState, useCallback, useLayoutEffect, RefObject } from 'react';

// Define a type for the different fullscreen API methods across browsers
interface FullscreenApi {
  requestFullscreen: 'requestFullscreen' | 'mozRequestFullScreen' | 'webkitRequestFullscreen' | 'msRequestFullscreen';
  exitFullscreen: 'exitFullscreen' | 'mozCancelFullScreen' | 'webkitExitFullscreen' | 'msExitFullscreen';
  fullscreenElement: 'fullscreenElement' | 'mozFullScreenElement' | 'webkitFullscreenElement' | 'msFullscreenElement';
  fullscreenchange: 'fullscreenchange' | 'mozfullscreenchange' | 'webkitfullscreenchange' | 'msfullscreenchange';
}

// A single object to hold the correct API names for the current browser
let fullscreenApi: FullscreenApi | null = null;

// This check needs to be client-side only
if (typeof window !== 'undefined' && window.document) {
    const doc = window.document.documentElement as any; // Use 'as any' to check for vendor prefixes
    if ('requestFullscreen' in doc) {
        fullscreenApi = {
            requestFullscreen: 'requestFullscreen',
            exitFullscreen: 'exitFullscreen',
            fullscreenElement: 'fullscreenElement',
            fullscreenchange: 'fullscreenchange',
        };
    } else if ('mozRequestFullScreen' in doc) {
        fullscreenApi = {
            requestFullscreen: 'mozRequestFullScreen',
            exitFullscreen: 'mozCancelFullScreen',
            fullscreenElement: 'mozFullScreenElement',
            fullscreenchange: 'mozfullscreenchange',
        };
    } else if ('webkitRequestFullscreen' in doc) {
        fullscreenApi = {
            requestFullscreen: 'webkitRequestFullscreen',
            exitFullscreen: 'webkitExitFullscreen',
            fullscreenElement: 'webkitFullscreenElement',
            fullscreenchange: 'webkitfullscreenchange',
        };
    } else if ('msRequestFullscreen' in doc) {
        fullscreenApi = {
            requestFullscreen: 'msRequestFullscreen',
            exitFullscreen: 'msExitFullscreen',
            fullscreenElement: 'msFullscreenElement',
            fullscreenchange: 'msfullscreenchange',
        };
    }
}

/**
 * A custom React hook to manage entering and exiting fullscreen mode for a specific element.
 *
 * @param {RefObject<HTMLElement>} ref - A React ref pointing to the element that should go fullscreen.
 * @returns {{ isFullscreen: boolean, enterFullscreen: () => void, exitFullscreen: () => void }} - An object with the current state and functions to enter/exit fullscreen.
 */
export const useFullscreen = (ref: RefObject<HTMLElement>) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(() => {
    if (!fullscreenApi) return;

    const element = ref.current as any; // Use 'as any' for vendor-prefixed methods
    const doc = document as any;

    if (!doc[fullscreenApi.fullscreenElement]) {
      element?.[fullscreenApi.requestFullscreen]().catch((err: Error) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  }, [ref]);

  const exitFullscreen = useCallback(() => {
    if (!fullscreenApi) return;
    const doc = document as any;

    if (doc[fullscreenApi.fullscreenElement]) {
      doc[fullscreenApi.exitFullscreen]();
    }
  }, []);

  useLayoutEffect(() => {
    if (!fullscreenApi) return;

    const doc = document as any;
    const handleChange = () => {
      setIsFullscreen(!!doc[fullscreenApi!.fullscreenElement]);
    };

    doc.addEventListener(fullscreenApi.fullscreenchange, handleChange);

    return () => {
      doc.removeEventListener(fullscreenApi!.fullscreenchange, handleChange);
    };
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen };
};
