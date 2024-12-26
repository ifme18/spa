import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { auth, db } from './Firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Default marker icon setup
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Services data
const SERVICES = [
  { id: 1, name: 'Normal Car Wash', price: 300, description: 'Exterior wash and basic interior cleaning' },
  { id: 2, name: 'Engine Wash', price: 300, description: 'Thorough engine bay cleaning and degreasing' },
  { id: 3, name: 'Underwash', price: 500, description: 'Complete undercarriage cleaning and protection' },
  { id: 4, name: 'Seat Cleaning', price: 500, description: 'Deep cleaning per seat, includes stain removal' },
  { id: 5, name: 'Carpet Cleaning', price: 30, description: 'Deep carpet cleaning per square foot' },
];

// Location input component
const LocationInput = ({ label, placeholder, value, onChange, required = false }) => (
  <div className="input-container">
    <label className="input-label">{label}</label>
    <input
      type="text"
      className="input-field"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  </div>
);

// Service card component
const ServiceCard = ({ service, quantity, onAdd, onRemove }) => (
  <div className="service-item">
    <div className="service-info">
      <h4 className="service-name">{service.name}</h4>
      <p className="service-description">{service.description}</p>
      <p className="service-price">KES {service.price}</p>
    </div>
    <div className="service-actions">
      {quantity > 0 && (
        <span className="service-quantity">{quantity}</span>
      )}
      <button onClick={() => onAdd(service)} className="btn-service btn-add">
        Add
      </button>
      {quantity > 0 && (
        <button onClick={() => onRemove(service)} className="btn-service btn-remove">
          Remove
        </button>
      )}
    </div>
  </div>
);

// Map click handler component
const MapClickHandler = ({ setLocation }) => {
  useMapEvents({
    click: (e) => {
      setLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
};

// Main booking component
const Booking = () => {
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    address: '',
    phone: '',
    houseNumber: '',
    addressNumber: '',
    street: '',
    estate: '',
    cart: {},
  });
  const [showCart, setShowCart] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const cartRef = useRef(null);

  const defaultCenter = { lat: -1.286389, lng: 36.817223 }; // Nairobi center

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) fetchUserBookings(user);
    });
    return () => unsubscribe();
  }, []);

  const handleAddService = (service) => {
    setForm(prev => {
      const newCart = { ...prev.cart };
      if (!newCart[service.id]) {
        newCart[service.id] = { 
          name: service.name, 
          price: service.price, 
          quantity: 0 
        };
      }
      newCart[service.id].quantity += 1;
      return { ...prev, cart: newCart };
    });
  };

  const handleRemoveService = (service) => {
    setForm(prev => {
      const newCart = { ...prev.cart };
      if (newCart[service.id]) {
        newCart[service.id].quantity -= 1;
        if (newCart[service.id].quantity <= 0) {
          delete newCart[service.id];
        }
      }
      return { ...prev, cart: newCart };
    });
  };

  const calculateTotal = () => 
    Object.values(form.cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getTotalItems = () => 
    Object.values(form.cart).reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to create a booking.');
      return;
    }

    if (!form.phone || Object.keys(form.cart).length === 0) {
      setError('Please provide a phone number and select at least one service.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        location: location ? {
          coordinates: location,
          mainAddress: form.address,
          details: {
            houseNumber: form.houseNumber,
            addressNumber: form.addressNumber,
            street: form.street,
            estate: form.estate,
          },
        } : null,
        phone: form.phone,
        cart: form.cart,
        total: calculateTotal(),
        createdAt: new Date(),
        status: 'pending'
      });

      setForm({
        address: '',
        phone: '',
        houseNumber: '',
        addressNumber: '',
        street: '',
        estate: '',
        cart: {},
      });
      setLocation(null);
      setShowCart(false);
      
      // Show success message
      alert('Booking confirmed successfully!');
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking">
      <header className="booking-header">
        <h1>Premium Car Wash Services</h1>
        <p className="header-subtitle">Professional cleaning for your vehicle</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="booking-container">
        <section className="location-section">
          <h2>Select Location</h2>
          <div className="map-container">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '400px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapClickHandler setLocation={setLocation} />
              {location && <Marker position={[location.lat, location.lng]} />}
            </MapContainer>
          </div>

          <div className="location-details">
            <h3>Location Details</h3>
            <form className="location-form">
              <LocationInput
                label="Main Address"
                placeholder="Enter your main address"
                value={form.address}
                onChange={(value) => setForm(prev => ({ ...prev, address: value }))}
              />
              <LocationInput
                label="House Number"
                placeholder="Enter house number"
                value={form.houseNumber}
                onChange={(value) => setForm(prev => ({ ...prev, houseNumber: value }))}
              />
              <LocationInput
                label="Address Number"
                placeholder="Enter address number"
                value={form.addressNumber}
                onChange={(value) => setForm(prev => ({ ...prev, addressNumber: value }))}
              />
              <LocationInput
                label="Street Name"
                placeholder="Enter street name"
                value={form.street}
                onChange={(value) => setForm(prev => ({ ...prev, street: value }))}
              />
              <LocationInput
                label="Estate Name"
                placeholder="Enter estate name"
                value={form.estate}
                onChange={(value) => setForm(prev => ({ ...prev, estate: value }))}
              />
              <LocationInput
                label="Phone Number *"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(value) => setForm(prev => ({ ...prev, phone: value }))}
                required
              />
            </form>
          </div>
        </section>

        <section className="services-section">
          <h2>Our Services</h2>
          <div className="services-container">
            {SERVICES.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                quantity={form.cart[service.id]?.quantity || 0}
                onAdd={handleAddService}
                onRemove={handleRemoveService}
              />
            ))}
          </div>
        </section>

        <button 
          className="cart-button"
          onClick={() => setShowCart(!showCart)}
        >
          <ShoppingCart size={24} />
          {getTotalItems() > 0 && (
            <span className="cart-count">{getTotalItems()}</span>
          )}
        </button>

        {showCart && (
          <div className="cart-summary" ref={cartRef}>
            <h3>Order Summary</h3>
            <div className="cart-items">
              {Object.values(form.cart).map(item => (
                <div key={item.name} className="cart-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>KES {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="total-section">
              <span className="total-label">Total Amount</span>
              <span className="total-amount">KES {calculateTotal()}</span>
            </div>
            <button
              className="btn-confirm"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;


