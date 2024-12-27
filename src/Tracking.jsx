import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { db } from './Firebase';
import './Tracking.css'; // Import the CSS file

// ✅ STATUS CONFIGURATION
const STATUS_CONFIG = {
  pending: {
    color: 'bg-yellow',
    icon: Clock,
    label: 'Pending'
  },
  completed: {
    color: 'bg-green',
    icon: CheckCircle,
    label: 'Completed'
  },
  cancelled: {
    color: 'bg-red',
    icon: AlertCircle,
    label: 'Cancelled'
  }
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

// ✅ BOOKING CARD COMPONENT
const BookingCard = ({ booking }) => {
  const status = booking.status || 'pending';
  const StatusIcon = STATUS_CONFIG[status]?.icon || Clock;

  return (
    <div className="booking-card">
      <div className="booking-header">
        <h3 className="booking-title">Booking #{booking.id.slice(-6)}</h3>
        <div className={`status-badge ${STATUS_CONFIG[status]?.color}`}>
          <StatusIcon size={16} />
          <span>{STATUS_CONFIG[status]?.label}</span>
        </div>
      </div>

      <div className="booking-details">
        <div className="detail-row">
          <span className="detail-label">Booked On:</span>
          <span className="detail-value">{formatDate(booking.createdAt)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Total Amount:</span>
          <span className="detail-value">KES {booking.total}</span>
        </div>

        {booking.location && (
          <div className="detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{booking.location.mainAddress}</span>
          </div>
        )}
      </div>

      {/* PROCESS FLOW */}
      <div className="process-flow">
        <div className="process-step">
          <div className={`step-dot ${status === 'pending' ? 'active' : ''}`} />
          <span>Pending</span>
        </div>
        <div className="step-arrow">→</div>
        <div className="process-step">
          <div className={`step-dot ${status === 'completed' ? 'active' : ''}`} />
          <span>Completed</span>
        </div>
        <div className="step-arrow">→</div>
        <div className="process-step">
          <div className={`step-dot ${status === 'cancelled' ? 'active' : ''}`} />
          <span>Cancelled</span>
        </div>
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
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

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
        <Loader className="animate-spin" size={24} />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required">
        <AlertCircle size={24} />
        <p>Please log in to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <header className="tracking-header">
        <h1>Your Bookings</h1>
        <p className="booking-count">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
        </p>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
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
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tracking;


