import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Text as SvgText, Line, Polygon, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';
import * as Location from 'expo-location';
import { Coordinates, calculateBearing } from '../utils/locationUtils';

const { width, height } = Dimensions.get('window');

// Helper function to get cardinal direction
function getCardinalDirection(angle: number | null): string {
  if (angle === null) return "--";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(angle / 22.5) % 16];
}

interface CompassViewProps {
  targetHeading?: number | null;
  /** If provided, the component will compute the bearing from the user's
   * current location to this destination and override targetHeading. */
  targetLocation?: Coordinates | null;
  /** Notifies parent whenever alignment status toggles */
  onAlignmentChange?: (aligned: boolean) => void;
}

interface Subscription {
  remove: () => void;
}

const FACING_THRESHOLD_DEGREES = 9;

// Animated SVG text component for smoothly counter-rotating the labels
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

export default function CompassView({ targetHeading: propTargetHeading = 45, targetLocation = null, onAlignmentChange }: CompassViewProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  // Keep sensor subscription in a ref so that the cleanup inside useEffect
  // always has access to the latest value without re-running the effect.
  const subscriptionRef = useRef<Subscription | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Track if we've already triggered haptics for current alignment
  const hasTriggeredHapticsRef = useRef(false);

  /**
   * Low-pass filter coefficient. 0 → no smoothing, 1 → maximum smoothing.
   * 0.2–0.3 feels responsive yet stable on most phones.
   */
  const SMOOTHING_ALPHA = 0.25;

  // Store previous heading to apply exponential smoothing across readings.
  const prevHeadingRef = useRef<number | null>(null);

  // Animated rotation for compass dial (rotates opposite to heading)
  const dialRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = Magnetometer.addListener(({ x, y }) => {
      // NOTE: This heading calculation is basic and does not account for device tilt.
      // For a more accurate compass, accelerometer data should be used to compensate for tilt.
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const rawHeading = (angle + 360) % 360;

      // --- Exponential smoothing to reduce noise & jitter ---
      const prev = prevHeadingRef.current;
      let smoothedHeading: number;

      if (prev === null) {
        smoothedHeading = rawHeading;
      } else {
        // Compute the shortest angular distance (-180..180] then apply smoothing.
        const delta = ((rawHeading - prev + 540) % 360) - 180;
        smoothedHeading = (prev + SMOOTHING_ALPHA * delta + 360) % 360;
      }

      prevHeadingRef.current = smoothedHeading;
      setHeading(smoothedHeading);
    });

    Magnetometer.setUpdateInterval(100); // 10 Hz – trade-off between responsiveness & battery.
    subscriptionRef.current = sub;

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (heading !== null) {
      // Dial rotates opposite to heading (iOS style)
      Animated.timing(dialRotation, {
        toValue: -heading,
        duration: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [heading]);

  // Subscribe to user location if targetLocation is provided
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      if (!targetLocation) return; // No need to request location if we only have static heading
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // meters
        },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    };

    startLocationUpdates();

    return () => {
      locationSubscription?.remove();
    };
  }, [targetLocation]);

  // Compute dynamic target heading whenever either location updates
  const dynamicTargetHeading = React.useMemo(() => {
    if (targetLocation && userLocation) {
      return calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        targetLocation.latitude,
        targetLocation.longitude
      );
    }
    return null;
  }, [targetLocation, userLocation]);

  // Choose which heading to guide towards
  const effectiveTargetHeading = dynamicTargetHeading ?? propTargetHeading;

  // Determine if facing target direction
  const isFacingTarget = 
    effectiveTargetHeading !== null && heading !== null &&
    Math.min(
      Math.abs(effectiveTargetHeading - heading),
      360 - Math.abs(effectiveTargetHeading - heading)
    ) <= FACING_THRESHOLD_DEGREES;

  // Notify parent when alignment state changes
  useEffect(() => {
    if (onAlignmentChange) {
      onAlignmentChange(isFacingTarget);
    }
    
    // Handle haptics - only trigger once when first becoming aligned
    if (isFacingTarget && !hasTriggeredHapticsRef.current) {
      // Trigger haptic feedback for 1-2 seconds
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hasTriggeredHapticsRef.current = true;
      
      // Stop haptics after 2 seconds
      setTimeout(() => {
        // Note: There's no direct way to "stop" haptics in Expo, but we prevent retriggering
        // The vibration will naturally stop after the notification pattern completes
      }, 2000);
    } else if (!isFacingTarget) {
      // Reset the haptics flag when no longer aligned
      hasTriggeredHapticsRef.current = false;
    }
  }, [isFacingTarget, onAlignmentChange]);

  // Larger dial: use 85% of the smaller screen dimension (previously 70%)
  const compassSize = Math.min(width, height) * 0.8;
  const compassRadius = compassSize / 2;
  const centerX = compassSize / 2;
  const centerY = compassSize / 2;

  // Dial rotation style (compass spins opposite to the phone heading)
  const dialRotateStyle = {
    transform: [
      {
        rotate: dialRotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  } as const;

  // Haptics now handled in useEffect above to prevent continuous triggering

  // Generate degree markings
  const renderDegreeMarkings = () => {
    const markings = [];
    
    // Tick marks every 5°
    for (let i = 0; i < 360; i += 5) {
      const isCardinal = i % 90 === 0;
      const isMajor = i % 30 === 0;
      const markLength = isCardinal ? 20 : isMajor ? 15 : 6; // minor tick shorter
      const strokeWidth = isCardinal ? 3 : isMajor ? 1.5 : 1;
      
      const startRadius = compassRadius - 10;
      const endRadius = startRadius - markLength;
      
      const startX = centerX + startRadius * Math.sin((i * Math.PI) / 180);
      const startY = centerY - startRadius * Math.cos((i * Math.PI) / 180);
      const endX = centerX + endRadius * Math.sin((i * Math.PI) / 180);
      const endY = centerY - endRadius * Math.cos((i * Math.PI) / 180);
      
      markings.push(
        <Line
          key={`mark-${i}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#fff"
          strokeWidth={strokeWidth}
        />
      );
    }
    return markings;
  };

  // Compute align turn instruction
  const getTurnInstruction = () => {
    if (effectiveTargetHeading === null || heading === null) return "--";
    let delta = ((effectiveTargetHeading - heading + 540) % 360) - 180; // [-180,180]
    const absDelta = Math.abs(delta);
    if (absDelta <= FACING_THRESHOLD_DEGREES) return "Aligned ✓";
    const arrow = delta > 0 ? "→" : "←";
    const dirWord = delta > 0 ? "right" : "left";
    return `Turn ${arrow} ${dirWord} ${absDelta.toFixed(0)}°`;
  };

  return (
    <View style={styles.container}>
      {/* Minimalist HUD */}
      <View style={styles.digitalReadout}>
        <Text style={styles.turnText}>{getTurnInstruction()}</Text>
      </View>

      {/* Compass Visual */}
      <View style={styles.compassContainer}>
        {/* Fixed Phone Orientation Marker at Top */}
        <View style={styles.phoneMarker}>
          <Svg width="40" height="60">
            {/* <Polygon
              points="20,3 10,30 30,30"
              fill="#ff4444"
              stroke="#000"
              strokeWidth="2"
            /> */}
            <Line
              x1="20"
              y1="15"
              x2="20"
              y2="43"
              stroke="red"
              strokeWidth="3"
            />
          </Svg>
        </View>

        {/* Rotating Compass Dial */}
        <Animated.View style={[styles.compassDial, dialRotateStyle]}>
          <Svg width={compassSize + 50} height={compassSize + 50} style={styles.compass}>
            {/* Outer circle (no fill for minimal look) */}
            <Circle
              cx={(compassSize + 50) / 2}
              cy={(compassSize + 50) / 2}
              r={compassRadius - 10}
              stroke="#444"
              strokeWidth="1"
              fill="none"
            />

            {/* Center HUD dot */}
            <Circle
              cx={(compassSize + 50) / 2}
              cy={(compassSize + 50) / 2}
              r="6"
              fill="#fff"
            />
            
            {/* Degree markings and numbers */}
            <G transform={`translate(25, 25)`}>
              {renderDegreeMarkings()}
            </G>
            
            {/* Target direction indicator on perimeter */}
            {effectiveTargetHeading !== null && (
              <G transform={`translate(25, 25)`}>
                <G transform={`rotate(${effectiveTargetHeading} ${centerX} ${centerY})`}>
                  <Circle
                    cx={centerX}
                    cy={15}
                    r="8"
                    fill={isFacingTarget ? '#00ff00' : '#ffaa00'}
                    stroke="#000"
                    strokeWidth="2"
                  />
                </G>
              </G>
            )}

            {/* Cardinal directions – they orbit with the dial (since they are inside) but
                each label counter-rotates so text stays horizontal */}
            {['N','E','S','W'].map((dir, idx) => {
              // 0°=N, 90°=E, 180°=S, 270°=W
              const angle = idx * 90;
              // Place labels on an inner ring to avoid colliding with external UI
              const labelRadius = compassRadius - 53; // 50px inside the outer rim
              const labelX = (compassSize + 50) / 2 + labelRadius * Math.sin((angle * Math.PI) / 180);
              const labelY = (compassSize + 50) / 2 - labelRadius * Math.cos((angle * Math.PI) / 180) + (dir==='N'?0:8);

              // Counter-rotation so text stays upright; dialRotation is negative heading.
              const counterRotation = dialRotation.interpolate({
                inputRange: [-360, 0, 360],
                outputRange: ['rotate(360 ' + labelX + ' ' + labelY + ')', 'rotate(0 ' + labelX + ' ' + labelY + ')', 'rotate(-360 ' + labelX + ' ' + labelY + ')'],
              });
              // North is red, E, S, W are white
              // const color = dir === 'N' ? '#ff4444' : '#fff';
              // const fontSize = dir === 'N' ? 25 : 24;
              const color = '#fff';
              const fontSize = dir === 'N' ? 24 : 24;

              return (
                <AnimatedSvgText
                  key={dir}
                  x={labelX}
                  y={labelY}
                  fontSize={fontSize}
                  fill={color}
                  textAnchor="middle"
                  fontWeight="bold"
                  transform={counterRotation as unknown as string}
                >
                  {dir}
                </AnimatedSvgText>
              );
            })}

          </Svg>
        </Animated.View>
      </View>

      {/* Status indicators */}
      <View style={styles.statusContainer}>
        {effectiveTargetHeading !== null && (
          <Text style={[styles.statusText, { color: isFacingTarget ? '#00ff00' : '#ffaa00' }]}>
            Target: {effectiveTargetHeading.toFixed(0)}° ({getCardinalDirection(effectiveTargetHeading)})
          </Text>
        )}
        <Text style={[styles.statusText, { color: isFacingTarget ? '#00ff00' : '#fff' }]}>
          {isFacingTarget ? 'Facing Target Direction!' : 'Turn to align with swamiji\'s direction'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  digitalReadout: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#333',
  },
  turnText: {
    fontSize: 20,
    color: '#00ffff',
    fontWeight: 'bold',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  phoneMarker: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  compassDial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compass: {
    backgroundColor: 'transparent',
  },
  statusContainer: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
});