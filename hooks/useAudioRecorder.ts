import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";

export function useAudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      // Önce mevcut interval'i temizle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Mevcut recording varsa temizle
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch {
          // Zaten durdurulmuş olabilir, ignore et
        }
        setRecording(null);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") throw new Error("Permission not granted");

      // iOS için audio mode'u düzgün ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Modern API kullan - createAsync
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();
          if (status.isRecording) {
            setDuration(status.durationMillis ?? 0);
          }
        } catch {
          // Recording artık geçerli değilse interval'i temizle
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 500);
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;

    // Önce interval'i temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();

      // iOS'ta recording bittikten sonra audio mode'u resetle
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      return uri;
    } catch (err) {
      console.error("Failed to stop recording", err);
      setRecording(null);
      setIsRecording(false);
      return null;
    }
  };

  const deleteRecording = async () => {
    // Önce interval'i temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        // iOS'ta recording bittikten sonra audio mode'u resetle
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {
        // Ignore cleanup errors
      }
      setRecording(null);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    deleteRecording,
    duration,
  };
}
