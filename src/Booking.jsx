import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ShoppingCart } from 'lucide-react';
import { auth, db } from './Firebase';
import './Booking.css';

const servicesList = [
  { name: 'Normal Car Wash', price: 300 },
  { name: 'Engine Wash', price: 300 },
  { name: 'Underwash', price: 500 },
  { name: 'Seat Cleaning (per seat)', price: 500 },
  { name: 'Carpet Cleaning (per sq ft)', price: 30 },
];

const Booking = () => {
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    address: '',
    phone: '',
    cart: {},
  });
  const [showCart, setShowCart] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [user, setUser] = useState(null);
  const cartRef = useRef(null);

  const mapStyles = {
    height: '300px',
    width: '100%',
  };

  const defaultCenter = {
    lat: -1.286389,
    lng: 36.817223,
  };

  const handleMapClick = (event) => {
    setLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  };

  const scrollToCart = () => {
    setShowCart(true);
    cartRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateCart = (service, increment = true) => {
    setForm((prev) => {
      const newCart = { ...prev.cart };
      if (!newCart[service.name]) newCart[service.name] = { price: service.price, quantity: 0 };

      newCart[service.name].quantity += increment ? 1 : -1;
      if (newCart[service.name].quantity <= 0) delete newCart[service.name];

      return { ...prev, cart: newCart };
    });
  };

  const calculateTotal = () => {
    return Object.values(form.cart).reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return Object.values(form.cart).reduce((acc, item) => acc + item.quantity, 0);
  };

  const handleSubmit = async () => {
    const auth = getAuth();

    if (!user) {
      alert('You must be logged in to create a booking.');
      return;
    }

    if (!location || !form.address || !form.phone || Object.keys(form.cart).length === 0) {
      alert('Please complete all fields and select services.');
      return;
    }

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        location,
        address: form.address,
        phone: form.phone,
        cart: form.cart,
        total: calculateTotal(),
        createdAt: new Date(),
      });
      alert('Booking confirmed!');
      setForm({ address: '', phone: '', cart: {} });
      setLocation(null);
      fetchUserBookings(user);
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Failed to confirm booking.');
    }
  };

  const fetchUserBookings = async (currentUser) => {
    if (!currentUser) return;

    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      setUserBookings(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch your bookings.');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserBookings(currentUser);
      } else {
        setUser(null);
        setUserBookings([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="booking relative">
      {/* Fixed Cart Icon */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={scrollToCart}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getTotalItems()}
            </span>
          )}
        </button>
      </div>

      <h1>Book a Cleaning Service</h1>

      {/* Map Section */}
      <div>
        <h3>Select Location</h3>
        <LoadScript googleMapsApiKey="YOUR_API_KEY">
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={13}
            center={defaultCenter}
            onClick={handleMapClick}
          >
            {location && <Marker position={location} />}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Form Inputs */}
      <div>
        <h3>Enter Details</h3>
        <input
          type="text"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      {/* Services Section */}
      <div>
        <h3>Select Services</h3>
        {servicesList.map((service) => (
          <div key={service.name} className="service-item">
            <span>{service.name} - Ksh {service.price}</span>
            <div className="quantity-controls">
              <button onClick={() => updateCart(service, false)}>-</button>
              <span>{form.cart[service.name]?.quantity || 0}</span>
              <button onClick={() => updateCart(service, true)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Section */}
      <div className="cart-section" ref={cartRef}>
        <button onClick={() => setShowCart(!showCart)}>
          {showCart ? 'Hide Cart' : 'View Cart'} ({getTotalItems()} items)
        </button>
        {showCart && (
          <div className="cart">
            <h3>Cart</h3>
            <ul>
              {Object.entries(form.cart).map(([name, item]) => (
                <li key={name}>
                  {name}: {item.quantity} x Ksh {item.price} = Ksh {item.quantity * item.price}
                </li>
              ))}
            </ul>
            <h4>Total: Ksh {calculateTotal()}</h4>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button onClick={handleSubmit}>Confirm Booking</button>

      {/* User Bookings Section */}
      <div>
        {user ? (
          <div>
            <h3>Your Bookings</h3>
            {userBookings.length > 0 ? (
              userBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <p><strong>Address:</strong> {booking.address}</p>
                  <p><strong>Total:</strong> Ksh {booking.total}</p>
                  <p><strong>Created At:</strong> {new Date(booking.createdAt.seconds * 1000).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>No bookings found.</p>
            )}
          </div>
        ) : (
          <p>Please log in to view your bookings.</p>
        )}
      </div>
    </div>
  );
};

export default Booking;
