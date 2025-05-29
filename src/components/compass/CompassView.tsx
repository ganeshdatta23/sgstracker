'use client';

import React from 'react';
import "@/styles/compass.css"; // Assuming compass.css is still relevant

// Helper function to get cardinal direction (copied from DarshanamView.tsx)
function getCardinalDirection(angle: number | null): string {
  if (angle === null) return "--";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
}

interface CompassViewProps {
  heading: number | null;
  targetHeading: number | null;
  isCalibrating?: boolean; // Optional, based on DarshanDirections usage
  showTiltWarning?: boolean; // Optional, based on DarshanDirections usage
  // FACING_THRESHOLD_DEGREES will be internal or a fixed value for now
}

const FACING_THRESHOLD_DEGREES = 15; // Copied from DarshanamView, can be adjusted

export function CompassView({
  heading,
  targetHeading,
  isCalibrating, // Prop received, can be used for UI cues
  showTiltWarning, // Prop received, can be used for UI cues
}: CompassViewProps) {
  // Determine opacity for the Swamiji point (target direction indicator)
  const swamijiPointOpacity = 
    targetHeading !== null && heading !== null &&
    Math.min(
      Math.abs(targetHeading - heading),
      360 - Math.abs(targetHeading - heading)
    ) <= FACING_THRESHOLD_DEGREES ? 1 : 0;

  // TODO: Implement UI for isCalibrating and showTiltWarning if needed
  // For example, display a message or change styles

  return (
    <div className="relative flex flex-col items-center justify-center text-white p-4">
      {/* Compass Visual */}
      <div className="compass"> {/* Ensure this class and its CSS are available */}
        <div className="arrow" /> {/* Ensure this class and its CSS are available */}
        <div
          className="compass-circle" /* Ensure this class and its CSS are available */
          style={{
            transform: `translate(-50%, -50%) rotate(${heading !== null ? -heading : 0}deg)`
          }}
        />
        {/* Swamiji Point - indicates target direction on the compass */}
        {targetHeading !== null && heading !== null && (
           <div
            className="swamiji-point" /* Ensure this class and its CSS are available */
            style={{
              transform: `translate(-50%, -50%) rotate(${(targetHeading - heading + 360) % 360}deg) translateY(-90px) `, // Adjust translateY to position on the circle edge
              opacity: swamijiPointOpacity, // Use calculated opacity
              width: '10px', // Example size
              height: '10px', // Example size
              backgroundColor: 'red', // Example color
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
           />
        )}
      </div>

      {/* Digital Readout for Device Heading */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center pointer-events-auto bg-black/60 p-3 rounded-lg backdrop-blur-sm z-20 w-40">
        <p className="text-3xl font-bold tabular-nums text-primary">
          {heading !== null ? `${heading.toFixed(0)}°` : "--°"}
        </p>
        <p className="text-md text-foreground/90">
          {getCardinalDirection(heading)}
        </p>
      </div>

      {/* Optional: Calibration and Tilt Warning UI */}
      {isCalibrating && (
        <div className="mt-2 p-2 bg-yellow-500/20 rounded-md text-sm">
          <p>Please calibrate your compass: move your device in a figure-8 pattern.</p>
        </div>
      )}
      {showTiltWarning && (
        <div className="mt-2 p-2 bg-red-500/20 rounded-md text-sm">
          <p>Please hold your device upright and level for accurate reading.</p>
        </div>
      )}
    </div>
  );
}
