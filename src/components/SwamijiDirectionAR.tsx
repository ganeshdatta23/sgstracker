'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Example icon
// import styles from './SwamijiDirectionAR.module.css'; // Will remove usage of this module CSS

interface SwamijiDirectionARProps {
  targetDirection?: number; 
  directionTolerance?: number; 
  imageUrl?: string;
  videoUrl?: string;
  // rotatingIcon?: React.ReactNode; // Will be replaced by new compass
  onClose?: () => void; // Optional: for a back button if needed within this component
}

// Styled components based on your CSS example
const CompassContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%', // Occupy full space given by parent
  padding: '20px',
  backgroundColor: 'hsl(var(--background))', // Matches app background
  color: 'hsl(var(--foreground))',
  textAlign: 'center',
}));

const CompassOuterRing = styled(Box)(({ theme }) => ({
  width: '280px',
  height: '280px',
  border: `3px solid hsl(var(--primary))`, // Use theme primary color (yellow/gold)
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  // transition: 'transform 0.5s ease-out', // For rotating the entire dial if preferred
}));

const CompassInnerRing = styled(Box)(({ theme }) => ({
  width: '200px',
  height: '200px',
  backgroundColor: 'hsla(var(--primary), 0.8)', // Semi-transparent primary color for the center
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.3)',
  color: 'hsl(var(--primary-foreground))', // Text color for on primary background
}));

const CompassNeedle = styled(Box)<{ rotation?: number }>(({ theme, rotation }) => ({
  position: 'absolute',
  top: '-25px', // Adjust to point from the center of the inner ring outwards, or from edge of outer ring
  left: '50%',
  width: 0,
  height: 0,
  borderLeft: '10px solid transparent',
  borderRight: '10px solid transparent',
  borderBottom: `30px solid hsl(var(--foreground))`, // Needle color - white/foreground
  transformOrigin: '50% 100%', // Rotate around the bottom center of the needle
  transform: `translateX(-50%) translateY(-100%) rotate(${rotation || 0}deg)`,
  transition: 'transform 0.5s ease-out',
  zIndex: 2,
}));

const CompassCenterData = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 1,
});

const HeadingDegree = styled(Typography)({
  fontSize: '50px',
  fontWeight: 'bold',
  lineHeight: 1,
});

const CardinalPoints = styled(Box)({
  position: 'absolute',
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  fontSize: '18px',
  fontWeight: 'bold',
  color: 'hsl(var(--foreground))', // Cardinal points color
  '& .north': { position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)' },
  '& .east': { position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)' },
  '& .south': { position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
  '& .west': { position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)' },
});


const SwamijiDirectionAR: React.FC<SwamijiDirectionARProps> = ({
  targetDirection = 0,
  directionTolerance = 15,
  imageUrl = '/images/swamiji-darshan.png',
  videoUrl = '/videos/darshan-background.mp4',
  onClose,
}) => {
  const [currentHeading, setCurrentHeading] = useState<number | null>(null);
  const [isFacingTarget, setIsFacingTarget] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showDarshan, setShowDarshan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // cameraVideoRef removed as it's not used in the new design focus

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      let heading = null;
      if (event.absolute === true && event.alpha !== null) {
        heading = event.alpha; 
      } else if (typeof (event as any).webkitCompassHeading === 'number') {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = event.alpha;
      }

      if (heading !== null) {
        setCurrentHeading(heading);
        const lowerBound = (targetDirection - directionTolerance + 360) % 360;
        const upperBound = (targetDirection + directionTolerance) % 360;
        let facing = lowerBound < upperBound ? (heading >= lowerBound && heading <= upperBound) : (heading >= lowerBound || heading <= upperBound);
        
        if (facing && !showDarshan) { // Only trigger if not already showing
          setIsFacingTarget(true);
          setTimeout(() => setShowDarshan(true), 1000); // Increased delay slightly
        } else if (!facing && showDarshan) { // Only trigger if currently showing
          setIsFacingTarget(false);
          setShowDarshan(false);
        }
      }
    },
    [targetDirection, directionTolerance, showDarshan] // Added showDarshan to dependencies
  );

  const requestOrientationPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
          window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        } else {
          setError('Device orientation permission not granted.');
          setPermissionGranted(false);
        }
      } catch (err) {
        console.error('Error requesting device orientation permission:', err);
        setError('Could not request device orientation permission.');
        setPermissionGranted(false);
      }
    } else {
      setPermissionGranted(true);
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
  };

  useEffect(() => {
    // requestOrientationPermission(); // Auto-request can be problematic, prefer button
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    };
  }, [handleDeviceOrientation]);

  useEffect(() => {
    if (showDarshan && videoRef.current) {
      videoRef.current.play().catch(playError => console.error('Error playing background video:', playError));
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [showDarshan]);

  // CSS for this component specifically, as module.css is removed
  const styles = {
    container: {
      width: '100%',
      height: '100vh', // Full viewport height for darshanam page
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      padding: '1rem',
      textAlign: 'center' as 'center',
      position: 'relative' as 'relative',
    },
    permissionButton: {
      padding: '10px 20px',
      fontSize: '16px',
      color: 'hsl(var(--primary-foreground))',
      backgroundColor: 'hsl(var(--primary))',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginTop: '20px',
    },
    errorText: {
      color: 'hsl(var(--destructive))',
      marginTop: '10px',
    },
    darshanContainer: {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    },
    backgroundVideo: {
      position: 'absolute' as 'absolute',
      top: '50%',
      left: '50%',
      width: '100%',
      height: '100%',
      objectFit: 'cover' as 'cover',
      transform: 'translate(-50%, -50%)',
      zIndex: 1,
    },
    darshanImage: {
      position: 'absolute' as 'absolute',
      top: '50%',
      left: '50%',
      width: '50%',
      height: '50%', // Adjust as needed
      maxWidth: '500px',
      maxHeight: '500px',
      objectPosition: 'center%',
      objectFit: 'contain' as 'contain',
      transform: 'translate(-50%, -50%)',
      zIndex: 2,
    },
    calibrationText: {
        marginTop: '20px',
        fontSize: '16px',
        color: 'hsl(var(--muted-foreground))',
    },
    // Back button styling (optional, if you add a back button inside this component)
    backButton: {
        position: 'absolute' as 'absolute',
        top: '20px',
        left: '20px',
        color: 'hsl(var(--primary))',
        zIndex: 10,
    }
  };

  if (error && !permissionGranted && !currentHeading) { // Show error primarily if permission fails before first reading
    return (
      <Box sx={styles.container}>
        <Typography variant="h6">Error</Typography>
        <Typography>{error}</Typography>
        <button onClick={requestOrientationPermission} style={styles.permissionButton}>
          Retry Granting Permission
        </button>
      </Box>
    );
  }

  if (!permissionGranted) {
    return (
      <Box sx={styles.container}>
        {onClose && <IconButton onClick={onClose} sx={styles.backButton}><ArrowBackIcon /></IconButton>}
        <Typography>This experience requires access to device orientation sensors.</Typography>
        <button onClick={requestOrientationPermission} style={styles.permissionButton}>
          Grant Orientation Permission
        </button>
        {error && <Typography sx={styles.errorText}>{error}</Typography>}
      </Box>
    );
  }
  
  if (showDarshan) {
    return (
      <Box sx={styles.darshanContainer}>
         {onClose && <IconButton onClick={onClose} sx={styles.backButton}><ArrowBackIcon /></IconButton>}
        <video
          ref={videoRef}
          style={styles.backgroundVideo}
          src={videoUrl}
          loop
          muted
          playsInline
        />
        <img
          src={imageUrl}
          alt="Swamiji Darshan"
          style={styles.darshanImage}
        />
      </Box>
    );
  }

  // Compass View
  return (
    <CompassContainer sx={styles.container}> {/* Using sx for the outermost container style override */}
      {onClose && <IconButton onClick={onClose} sx={styles.backButton}><ArrowBackIcon /></IconButton>}
      <CompassOuterRing>
        <CompassNeedle rotation={currentHeading !== null ? 360 - currentHeading : 0} />
        {/* To rotate the entire dial instead of just the needle: 
           style={{ transform: `rotate(${currentHeading !== null ? -currentHeading : 0}deg)` }} */}
        <CardinalPoints>
          <span className="north">N</span>
          <span className="east">E</span>
          <span className="south">S</span>
          <span className="west">W</span>
        </CardinalPoints>
        <CompassInnerRing>
          <CompassCenterData>
            {currentHeading !== null ? (
              <HeadingDegree>{currentHeading.toFixed(0)}°</HeadingDegree>
            ) : (
              <Typography variant="h4">--°</Typography> // Placeholder while loading
            )}
            {/* Magnetic field and signal bars from your example can be added here if data is available */}
          </CompassCenterData>
        </CompassInnerRing>
      </CompassOuterRing>
      <Typography sx={styles.calibrationText}>
        {currentHeading === null ? "Calibrating compass..." : "Align with Swamiji's Direction"}
        <br />
        Move device in a figure-eight motion if needed.
      </Typography>
    </CompassContainer>
  );
};

export default SwamijiDirectionAR;