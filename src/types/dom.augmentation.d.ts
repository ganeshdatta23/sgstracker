// d:\GuruTracker\src\types\dom.augmentation.d.ts
declare var DeviceOrientationEvent: {
    new(type: string, eventInitDict?: DeviceOrientationEventInit): DeviceOrientationEvent;
    prototype: DeviceOrientationEvent;
    requestPermission?: () => Promise<'granted' | 'denied'>; // Add the optional static method
};