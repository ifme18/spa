import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './Firebase';
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Tracking.css';

// ✅ STATUS CONFIGURATION
const STATUS_CONFIG = {
  Pending: { color: 'bg-yellow-200', icon: Clock, label: 'Pending' },
  Washing: { color: 'bg-blue-300', icon: Clock, label: 'Washing' },
  Drying: { color: 'bg-purple-300', icon: Clock, label: 'Drying' },
  Completed: { color: 'bg-green-400', icon: CheckCircle, label: 'Completed' }
};

// ✅ FORMAT DATE FUNCTION
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

// ✅ SERVICE STATUS TRACKER COMPONENT
const ServiceStatusTracker = ({ serviceName, status }) => {
  const StatusIcon = STATUS_CONFIG[status]?.icon || Clock;

  return (
    <div className="service-status-tracker">
      <h4 className="service-title">{serviceName}</h4>
      <div className={`status-badge ${STATUS_CONFIG[status]?.color}`}>
        <StatusIcon size={18} />
        <span>{STATUS_CONFIG[status]?.label}</span>
      </div>
      <div className="progress-steps">
        {['Pending', 'Washing', 'Drying', 'Completed'].map((step) => (
          <div key={step} className={`progress-step ${step === status ? 'active' : ''}`}>
            <div className="step-dot" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ MAIN TRACKING COMPONENT
const Tracking = () => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserBookings = async (userId) => {
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const fetchedBookings = [];
      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() });
      });
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
      setError('Failed to fetch your bookings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserBookings(currentUser.uid);
      } else {
        setBookings([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <Loader className="animate-spin text-blue-500" size={28} />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required">
        <AlertCircle size={28} className="text-red-500" />
        <p>Please log in to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <header className="tracking-header">
        <h1>Your Booking Status</h1>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} className="text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card shadow-md">
              <h3 className="booking-id">Booking ID: {booking.id}</h3>
              <p><strong>Phone:</strong> {booking.phone}</p>
              <p><strong>Booked On:</strong> {formatDate(booking.createdAt)}</p>
              
              <div className="service-tracking">
                {booking.cart &&
                  Object.entries(booking.cart).map(([serviceName, serviceDetails]) => (
                    <ServiceStatusTracker
                      key={serviceName}
                      serviceName={serviceName}
                      status={serviceDetails.status || 'Pending'}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tracking;




