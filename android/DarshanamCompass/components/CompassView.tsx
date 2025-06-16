import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Helper function to get cardinal direction
function getCardinalDirection(angle: number | null): string {
  if (angle === null) return "--";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(angle / 22.5);
  if (index >= 16) {
    return "N";
  }
  return directions[index];
}

interface CompassViewProps {
  targetHeading?: number | null;
}

interface Subscription {
  remove: () => void;
}

const FACING_THRESHOLD_DEGREES = 15;

export default function CompassView({ targetHeading = 45 }: CompassViewProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener((data) => {
        const { x, y } = data;
        // NOTE: This heading calculation is basic and does not account for device tilt.
        // For a more accurate compass, accelerometer data should be used to compensate for tilt.
        const angle = Math.atan2(y, x) * (180 / Math.PI);
        const heading = (angle + 360) % 360;
        setHeading(heading);
      })
    );
    Magnetometer.setUpdateInterval(100);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  // Determine if facing target direction
  const isFacingTarget = 
    targetHeading !== null && heading !== null &&
    Math.min(
      Math.abs(targetHeading - heading),
      360 - Math.abs(targetHeading - heading)
    ) <= FACING_THRESHOLD_DEGREES;

  const compassSize = Math.min(width, height) * 0.6;
  const compassRadius = compassSize / 2;
  const centerX = compassSize / 2;
  const centerY = compassSize / 2;

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
        <Svg width={compassSize} height={compassSize} style={styles.compass}>
          {/* Outer circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={compassRadius - 10}
            stroke="#333"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Inner circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={compassRadius - 40}
            stroke="#666"
            strokeWidth="1"
            fill="none"
          />

          {/* Cardinal directions */}
          <SvgText
            x={centerX}
            y={30}
            fontSize="20"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            N
          </SvgText>
          <SvgText
            x={compassSize - 20}
            y={centerY + 7}
            fontSize="20"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            E
          </SvgText>
          <SvgText
            x={centerX}
            y={compassSize - 10}
            fontSize="20"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            S
          </SvgText>
          <SvgText
            x={20}
            y={centerY + 7}
            fontSize="20"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            W
          </SvgText>

          {/* North arrow */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - (compassRadius - 20)}
            stroke="#ff0000"
            strokeWidth="3"
            transform={`rotate(${heading || 0} ${centerX} ${centerY})`}
          />
          
          {/* South arrow */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY + (compassRadius - 60)}
            stroke="#ff0000"
            strokeWidth="2"
            transform={`rotate(${heading || 0} ${centerX} ${centerY})`}
          />

          {/* Target direction indicator */}
          {targetHeading !== null && (
            <Circle
              cx={centerX}
              cy={centerY - (compassRadius - 30)}
              r="8"
              fill={isFacingTarget ? "#00ff00" : "#ffff00"}
              stroke="#fff"
              strokeWidth="2"
              transform={`rotate(${targetHeading} ${centerX} ${centerY})`}
            />
          )}
        </Svg>
      </View>

      {/* Status indicators */}
      <View style={styles.statusContainer}>
        {targetHeading !== null && (
          <Text style={[styles.statusText, { color: isFacingTarget ? '#00ff00' : '#ffff00' }]}>
            Target: {targetHeading.toFixed(0)}° ({getCardinalDirection(targetHeading)})
          </Text>
        )}
        <Text style={[styles.statusText, { color: isFacingTarget ? '#00ff00' : '#fff' }]}>
          {isFacingTarget ? 'Facing Target Direction!' : 'Turn to align with target'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
    minWidth: 150,
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
  },
  compass: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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