import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Text as SvgText, Line, Polygon, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

// Helper function to get cardinal direction
function getCardinalDirection(angle: number | null): string {
  if (angle === null) return "--";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(angle / 22.5) % 16];
}

interface CompassViewProps {
  targetHeading?: number | null;
}

interface Subscription {
  remove: () => void;
}

const FACING_THRESHOLD_DEGREES = 5;

// Animated SVG text component for smoothly counter-rotating the labels
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

export default function CompassView({ targetHeading = 45 }: CompassViewProps) {
  const [heading, setHeading] = useState<number | null>(null);
  // Keep sensor subscription in a ref so that the cleanup inside useEffect
  // always has access to the latest value without re-running the effect.
  const subscriptionRef = useRef<Subscription | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

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

  // Determine if facing target direction
  const isFacingTarget = 
    targetHeading !== null && heading !== null &&
    Math.min(
      Math.abs(targetHeading - heading),
      360 - Math.abs(targetHeading - heading)
    ) <= FACING_THRESHOLD_DEGREES;

  const compassSize = Math.min(width, height) * 0.7;
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

  if (isFacingTarget) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  // Generate degree markings
  const renderDegreeMarkings = () => {
    const markings = [];
    
    for (let i = 0; i < 360; i += 10) {
      const isCardinal = i % 90 === 0;
      const isMajor = i % 30 === 0;
      const markLength = isCardinal ? 25 : isMajor ? 15 : 8;
      const strokeWidth = isCardinal ? 3 : isMajor ? 2 : 1;
      
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

  return (
    <View style={styles.container}>
      {/* Digital Readout */}
      <View style={styles.digitalReadout}>
        <Text style={styles.headingText}>
          {heading !== null ? `${heading.toFixed(0)}°` : "--°"}
        </Text>
        <Text style={styles.directionText}>
          {getCardinalDirection(heading)}
        </Text>
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
              y1="10"
              x2="20"
              y2="43"
              stroke="white"
              strokeWidth="4"
            />
          </Svg>
        </View>

        {/* Rotating Compass Dial */}
        <Animated.View style={[styles.compassDial, dialRotateStyle]}>
          <Svg width={compassSize + 50} height={compassSize + 50} style={styles.compass}>
            {/* Outer circle */}
            <Circle
              cx={(compassSize + 50) / 2}
              cy={(compassSize + 50) / 2}
              r={compassRadius - 10}
              stroke="#444"
              strokeWidth="3"
              fill="rgba(0, 0, 0, 0.3)"
            />
            
            {/* Inner circle */}
            <Circle
              cx={(compassSize + 50) / 2}
              cy={(compassSize + 50) / 2}
              r={compassRadius - 60}
              stroke="#666"
              strokeWidth="1"
              fill="none"
            />
            
            {/* Degree markings and numbers */}
            <G transform={`translate(25, 25)`}>
              {renderDegreeMarkings()}
            </G>
            
            {/* Target direction indicator on perimeter */}
            {targetHeading !== null && (
              <G transform={`translate(25, 25)`}>
                <G transform={`rotate(${targetHeading} ${centerX} ${centerY})`}>
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
              const labelX = (compassSize + 50) / 2 + (compassRadius - 25) * Math.sin((angle * Math.PI) / 180);
              const labelY = (compassSize + 50) / 2 - (compassRadius - 25) * Math.cos((angle * Math.PI) / 180) + (dir==='N'?0:10);

              // Counter-rotation so text stays upright; dialRotation is negative heading.
              const counterRotation = dialRotation.interpolate({
                inputRange: [-360, 0, 360],
                outputRange: ['rotate(360 ' + labelX + ' ' + labelY + ')', 'rotate(0 ' + labelX + ' ' + labelY + ')', 'rotate(-360 ' + labelX + ' ' + labelY + ')'],
              });

              const color = dir === 'N' ? '#ff4444' : '#fff';
              const fontSize = dir === 'N' ? 28 : 24;

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
        {targetHeading !== null && (
          <Text style={[styles.statusText, { color: isFacingTarget ? '#00ff00' : '#ffaa00' }]}>
            Target: {targetHeading.toFixed(0)}° ({getCardinalDirection(targetHeading)})
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
  headingText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: 'monospace',
  },
  directionText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
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