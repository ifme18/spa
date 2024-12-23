import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './Firebase';
import { getAuth } from 'firebase/auth';

const Tracking = () => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user bookings
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
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch your bookings. Please try again.');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      fetchUserBookings(currentUser.uid);
    } else {
      setUser(null);
      setBookings([]);
    }
  }, []);

  return (
    <div className="user-dashboard p-4">
      <h1 className="text-2xl font-bold mb-6">Your Bookings</h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      {user ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border p-4 mb-4 rounded">
              <h3 className="text-xl font-semibold mb-2">Booking {booking.id}</h3>

              <div>
                {Object.entries(booking.cart).map(([serviceName, serviceDetails]) => (
                  <div key={serviceName} className="flex justify-between items-center mb-2">
                    <span>{serviceName}</span>
                    <span>{serviceDetails.status || 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You need to be logged in to view your bookings.</p>
      )}
    </div>
  );
};

export default Tracking;
