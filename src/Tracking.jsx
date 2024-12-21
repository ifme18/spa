
import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { doc, onSnapshot, query, where, collection } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from './Firebase';  // Make sure this import is correct
import './Tracking.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: -1.286389, // Default center (you can adjust these coordinates)
  lng: 36.817223,
};

const Tracking = () => {
  const [trackingData, setTrackingData] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(currentUser ? true : false); // Only show loading if user is logged in
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeTracking = null;

    const setupTrackingListener = async (userId) => {
      try {
        const trackingCollection = collection(db, "tracking");
        const userQuery = query(trackingCollection, where("userId", "==", userId));

        unsubscribeTracking = onSnapshot(userQuery, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setTrackingData(data);
          } else {
            setTrackingData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching tracking data:", error);
          setError("Failed to load tracking data. Please try again later.");
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up tracking listener:", error);
        setError("Failed to initialize tracking. Please try again later.");
        setLoading(false);
      }
    };

    if (user) {
      setupTrackingListener(user.uid);
    }

    return () => {
      if (unsubscribeTracking) {
        unsubscribeTracking();
      }
    };
  }, [user]);

  if (!user) {
    return (
      <div className="tracking-error">
        <h2>Please log in to track your order</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tracking-loading">
        <h2>Loading your tracking information...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="tracking">
      <h1>Track Your Cleaning Order</h1>
      <p>View the current location and stages of your order in real time.</p>

      <LoadScript googleMapsApiKey="YOUR_API_KEY">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={trackingData?.location || defaultCenter}
          zoom={13}
        >
          {trackingData && trackingData.location ? (
            <Marker
              position={trackingData.location}
              onClick={() => setShowInfoWindow(!showInfoWindow)}
            >
              {showInfoWindow && (
                <InfoWindow 
                  position={trackingData.location}
                  onCloseClick={() => setShowInfoWindow(false)}
                >
                  <div className="tracking-info">
                    <p><strong>Current Location</strong></p>
                    <p>Latitude: {trackingData.location.lat.toFixed(4)}</p>
                    <p>Longitude: {trackingData.location.lng.toFixed(4)}</p>

                    <div className="tracking-stages">
                      <h4>Stages</h4>
                      {trackingData.stages?.map((stage, index) => (
                        <div
                          key={index}
                          className={`stage-item ${stage.status === 'completed' ? 'completed' : ''}`}
                        >
                          <span className="stage-dot"></span>
                          <span className="stage-name">{stage.name}</span>
                          {stage.status === 'completed' && (
                            <span className="stage-timestamp">
                              {new Date(stage.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ) : (
            <div className="no-tracking-data">
              <p>No active orders found. Book a service to start tracking.</p>
            </div>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default Tracking;