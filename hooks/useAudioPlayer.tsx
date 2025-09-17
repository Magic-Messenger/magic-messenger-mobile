import { Audio, AVPlaybackStatus } from "expo-av";
import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadAndPlay = async (uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        setIsPlaying(status.isPlaying);
        setPosition(status.positionMillis ?? 0);
        setDuration(status.durationMillis ?? 0);
      });
    } catch (e) {
      console.log("loadAndPlay error:", e);
    }
  };

  const play = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  };

  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setPosition(0);
    }
  };

  const currentTime = useMemo(() => formatTime(position), [position]);
  const totalTime = useMemo(() => formatTime(duration), [duration]);

  return {
    isPlaying,
    position,
    duration,
    currentTime,
    totalTime,
    loadAndPlay,
    play,
    pause,
    stop,
  };
}
