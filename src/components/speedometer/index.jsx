import { useState, useEffect } from "react";
import Speedometer from "./speedometer";

const Tracker = ({isLoaded, setCurrentLocation, google}) => {
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [lastPosition, setLastPosition] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [totalDistance, setTotalDistance] = useState(0);
    const [distanceSinceLastFuel, setDistanceSinceLastFuel] = useState(0);
    const [isMoving, setIsMoving] = useState(false);
    const [watchId, setWatchId] = useState(null);

    const startTracking = () => {
        if ("geolocation" in navigator) {
            const id = navigator.geolocation.watchPosition(
            (position) => {
                const newPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: position.timestamp || Date.now()
                };

                if (lastPosition && lastUpdateTime) {
                // Calculate distance in meters
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(lastPosition.lat, lastPosition.lng),
                    new google.maps.LatLng(newPosition.lat, newPosition.lng)
                );
                
                // Calculate time difference in hours
                const timeDiff = (newPosition.timestamp - lastUpdateTime) / 3600000;
                
                // Calculate speed in km/h
                const speed = distance / 1000 / timeDiff;
                setCurrentSpeed(speed || 0);

                // Update total distance
                setTotalDistance(prev => prev + distance);
                setDistanceSinceLastFuel(prev => prev + distance);

                // Check for movement state changes
                if (speed === 0 && isMoving) {
                    // Send rest event
                    createEvent({
                    type: "rest",
                    startTime: lastUpdateTime,
                    endTime: newPosition.timestamp,
                    location: newPosition
                    });
                    setIsMoving(false);
                } else if (speed > 0 && !isMoving) {
                    // Send driving event
                    createEvent({
                    type: "driving",
                    startTime: newPosition.timestamp,
                    location: newPosition
                    });
                    setIsMoving(true);
                }

                // Check for fueling event (every 1000 miles = 1609.34 km)
                if (distanceSinceLastFuel + distance >= 1609340) {
                    createEvent({
                    type: "fueling",
                    time: newPosition.timestamp,
                    location: newPosition,
                    distance: distanceSinceLastFuel + distance
                    });
                    setDistanceSinceLastFuel(0);
                }
                }

                setLastPosition(newPosition);
                setLastUpdateTime(newPosition.timestamp);
                setCurrentLocation(newPosition);
            },
            (error) => console.error("Error watching position:", error),
            { enableHighAccuracy: true, maximumAge: 0 }
            );
            setWatchId(id);
        }
    };

    // Stop tracking
    const stopTracking = () => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        };

        // Send event to backend
        const createEvent = async (event) => {
        try {
            const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
            });
            if (!response.ok) throw new Error('Failed to send event');
            console.log('Event logged:', event);
        } catch (error) {
            console.error('Error sending event:', error);
        }
    };

    // Start tracking when component mounts
    useEffect(() => {
        startTracking();
        return () => stopTracking();
    }, []);

    // Update tracking when dependencies change
    useEffect(() => {
        if (lastPosition && isLoaded) {
            startTracking();
    }
    }, [lastPosition, isLoaded]);

    return (
        <div className="speed-tracker d-flex flex-column flex-md-row justify-content-around align-items-center">
            <Speedometer speed={currentSpeed} />
            <div className="speed-info ms-1 ms-md-5">
                <div className="info-box">
                    <span className="info-label">Current Speed: </span>
                    <span className="info-value">{currentSpeed.toFixed(1)} km/h</span>
                </div>
                <div className="info-box">
                    <span className="info-label">Total Distance Covered: </span>
                    <span className="info-value">{(totalDistance / 1000).toFixed(2)} km</span>
                </div>
                <div className="info-box">
                    <span className="info-label">Distance Since Last Fuel: </span>
                    <span className="info-value">{(distanceSinceLastFuel / 1000).toFixed(2)} km</span>
                </div>
            </div>
        </div>
    )

}

export default Tracker;