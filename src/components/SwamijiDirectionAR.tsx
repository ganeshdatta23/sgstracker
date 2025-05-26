'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SwamijiDirectionAR.module.css';

interface SwamijiDirectionARProps {
  targetDirection?: number; // 0-360 degrees, 0 for North
  directionTolerance?: number; // e.g., 15 degrees on either side
  imageUrl?: string;
  videoUrl?: string;
  rotatingIcon?: React.ReactNode;
}

const SwamijiDirectionAR: React.FC<SwamijiDirectionARProps> = ({
  targetDirection = 0, // Default to North
  directionTolerance = 15,
  imageUrl = '/images/swamiji-darshan.png',
  videoUrl = '/videos/darshan-background.mp4',
  rotatingIcon = <div className={styles.defaultRotatingIcon}>❖</div>,
}) => {
  const [currentHeading, setCurrentHeading] = useState<number | null>(null);
  const [isFacingTarget, setIsFacingTarget] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showDarshan, setShowDarshan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null); // For camera feed

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      let heading = null;
      // event.webkitCompassHeading for iOS Safari
      // event.alpha for other browsers (magnetic north)
      // 'absolute' orientation events provide true north if available
      if (event.absolute === true && event.alpha !== null) {
        heading = event.alpha; // True North
      } else if (typeof (event as any).webkitCompassHeading === 'number') {
        heading = (event as any).webkitCompassHeading; // iOS Safari
      } else if (event.alpha !== null) {
        // This might be magnetic north, you might need to adjust for declination
        // For simplicity, we'll use it as is.
        heading = event.alpha;
      }

      if (heading !== null) {
        setCurrentHeading(heading);
        const lowerBound = (targetDirection - directionTolerance + 360) % 360;
        const upperBound = (targetDirection + directionTolerance) % 360;

        let facing = false;
        if (lowerBound < upperBound) {
          facing = heading >= lowerBound && heading <= upperBound;
        } else {
          // Handles cases where the range crosses 0/360 (e.g., target North)
          facing = heading >= lowerBound || heading <= upperBound;
        }

        if (facing) {
          setIsFacingTarget(true);
          // Debounce or delay showing darshan to prevent flickering
          setTimeout(() => setShowDarshan(true), 500);
        } else {
          setIsFacingTarget(false);
          setShowDarshan(false);
        }
      }
    },
    [targetDirection, directionTolerance]
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
      // For browsers that don't require explicit permission (e.g., Android Chrome)
      setPermissionGranted(true);
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
  };

  // Optional: Request Camera Permission for AR background
  const requestCameraPermission = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
        // You would then use this stream as a background in a WebGL/WebXR scene
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(prev => `${prev ? prev + ' ' : ''}Camera access denied or not available.`);
      }
    } else {
       setError(prev => `${prev ? prev + ' ' : ''}Camera API not available.`);
    }
  };

  useEffect(() => {
    // Attempt to request permissions when component mounts or on a user interaction
    // For a better UX, trigger requestOrientationPermission on a button click.
    // requestOrientationPermission(); // Auto-request on mount (might be blocked)
    // requestCameraPermission(); // Optional: for AR background

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [handleDeviceOrientation]);

  useEffect(() => {
    if (showDarshan && videoRef.current) {
      videoRef.current.play().catch(playError => {
        console.error('Error playing background video:', playError);
        // Autoplay might be blocked, user interaction might be needed
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [showDarshan]);

  if (error && !permissionGranted) {
    return <div className={styles.container}><p>Error: {error}</p></div>;
  }

  if (!permissionGranted) {
    return (
      <div className={styles.container}>
        <p>This experience requires access to device orientation sensors.</p>
        <button onClick={requestOrientationPermission} className={styles.permissionButton}>
          Grant Orientation Permission
        </button>
        {/* Optional: Button to grant camera permission
        <button onClick={requestCameraPermission} className={styles.permissionButton}>
          Grant Camera Permission (for AR)
        </button>
        */}
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Optional: Camera feed for AR background */}
      {/* <video ref={cameraVideoRef} className={styles.cameraFeed} autoPlay playsInline muted /> */}

      {showDarshan ? (
        <div className={styles.darshanContainer}>
          <video
            ref={videoRef}
            className={styles.backgroundVideo}
            src={videoUrl}
            loop
            muted
            playsInline
          />
          <img
            src={imageUrl}
            alt="Swamiji Darshan"
            className={styles.darshanImage}
          />
        </div>
      ) : (
        <div className={`${styles.iconContainer} ${isFacingTarget ? '' : styles.rotating}`}>
          {rotatingIcon}
          {currentHeading !== null && <p className={styles.headingDisplay}>Heading: {currentHeading.toFixed(0)}°</p>}
          {!isFacingTarget && <p>Align with Swamiji's Direction ({targetDirection}°)</p>}
        </div>
      )}
    </div>
  );
};

export default SwamijiDirectionAR;