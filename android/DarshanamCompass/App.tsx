import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, Alert } from 'react-native';
import CompassView from './components/CompassView';
import { parseUrlOrCoords } from './utils/locationUtils';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { calculateSunTimes, formatSunTime, debugSunriseSunset } from './utils/sunCalculator';

export default function App() {
  // Replace this with the desired URL or "lat,lng" string.
  const TARGET_LOCATION_INPUT = "https://www.google.com/maps/@12.308367,76.645467,17z";

  const parsedTarget = useMemo(() => parseUrlOrCoords(TARGET_LOCATION_INPUT), [TARGET_LOCATION_INPUT]);
  
  // Alignment state
  const [isAligned, setIsAligned] = useState(false);
  const [nextSunEvent, setNextSunEvent] = useState<{ time: Date; type: 'sunrise' | 'sunset'; isToday: boolean } | null>(null);

  // Handle Darshan audio
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Load the sound only once
    const prepareSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/audio/background-music.mp3'),
        { shouldPlay: false, isLooping: true }
      );
      soundRef.current = sound;
    };
    prepareSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Play / pause audio depending on alignment
  useEffect(() => {
    const handleAudio = async () => {
      const sound = soundRef.current;
      if (!sound) return;
      if (isAligned) {
        try {
          await sound.playAsync();
        } catch (e) {
          console.warn('Failed to play darshan audio', e);
        }
      } else {
        try {
          await sound.pauseAsync();
        } catch (_) {}
      }
    };
    handleAudio();
  }, [isAligned]);

  // Calculate and display next sunrise/sunset using new API
  useEffect(() => {
    const getSunEvent = async () => {
      if (parsedTarget) {
        try {
          // Get today's sun times (cached after first call)
          const sunTimes = await calculateSunTimes(parsedTarget.latitude, parsedTarget.longitude);
          const now = new Date();
          
          // Determine next event
          if (now < sunTimes.sunrise) {
            setNextSunEvent({ time: sunTimes.sunrise, type: 'sunrise', isToday: true });
          } else if (now < sunTimes.sunset) {
            setNextSunEvent({ time: sunTimes.sunset, type: 'sunset', isToday: true });
          } else {
            // Tomorrow's sunrise
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowTimes = await calculateSunTimes(parsedTarget.latitude, parsedTarget.longitude, tomorrow);
            setNextSunEvent({ time: tomorrowTimes.sunrise, type: 'sunrise', isToday: false });
          }
        } catch (error) {
          console.error('Error getting sun times:', error);
          // Fallback to show a generic message
          setNextSunEvent(null);
        }
      }
    };
    
    getSunEvent();
  }, [parsedTarget]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Guru Digbandanam</Text>
        {nextSunEvent && (
          <Text style={styles.sunEventText}>
            Next {nextSunEvent.type}: {formatSunTime(nextSunEvent.time)}
            {nextSunEvent.isToday ? ' today' : ' tomorrow'}
          </Text>
        )}
      </View>

      {/* Compass Component */}
      {parsedTarget ? (
        <CompassView targetLocation={parsedTarget} onAlignmentChange={setIsAligned} />
      ) : (
        <CompassView targetHeading={45} onAlignmentChange={setIsAligned} />
      )}

      {/* Darshan overlay */}
      {isAligned && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Background video */}
          <Video
            style={StyleSheet.absoluteFill}
            source={require('./assets/videos/darshan-background.mp4')}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />
          {/* Swamiji image overlay */}
          <Image
            source={require('./assets/images/swamiji-darshan.png')}
            style={styles.darshanImage}
            resizeMode="contain"
          />
          {/* Close button to exit overlay */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setIsAligned(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  sunEventText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  darshanImage: {
    width: '80%',
    height: '50%',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
});
