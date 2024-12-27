import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { auth, db } from './Firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 🖌️ **Default Marker Icon Setup**
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// 🛠️ **Services Data**
const SERVICES = [
  { id: 1, name: 'Normal Car Wash', price: 300, description: 'Exterior wash and basic interior cleaning' },
  { id: 2, name: 'Engine Wash', price: 300, description: 'Thorough engine bay cleaning and degreasing' },
  { id: 3, name: 'Underwash', price: 500, description: 'Complete undercarriage cleaning and protection' },
  { id: 4, name: 'Seat Cleaning', price: 500, description: 'Deep cleaning per seat, includes stain removal' },
  { id: 5, name: 'Carpet Cleaning', price: 30, description: 'Deep carpet cleaning per square foot' },
];

// 📍 **Map Click Handler**
const MapClickHandler = ({ setLocation }) => {
  useMapEvents({
    click: (e) => {
      setLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
};

// 📦 **Service Card Component**
const ServiceCard = ({ service, quantity, onAdd, onRemove }) => (
  <div className="service-item">
    <h4>{service.name}</h4>
    <p>{service.description}</p>
    <p>KES {service.price}</p>
    <div className="service-actions">
      <button onClick={() => onAdd(service)}>Add</button>
      {quantity > 0 && (
        <>
          <span>{quantity}</span>
          <button onClick={() => onRemove(service)}>Remove</button>
        </>
      )}
    </div>
  </div>
);

// 📝 **Location Input Component**
const LocationInput = ({ label, placeholder, value, onChange }) => (
  <div className="input-group">
    <label>{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

// 🚗 **Main Booking Component**
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

  // 🧑‍💼 **Authentication Check**
  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 🛒 **Handle Add Service**
  const handleAddService = (service) => {
    setForm((prev) => {
      const newCart = { ...prev.cart };
      if (!newCart[service.id]) {
        newCart[service.id] = {
          name: service.name,
          price: service.price,
          quantity: 0,
        };
      }
      newCart[service.id].quantity += 1;
      return { ...prev, cart: newCart };
    });
  };

  // 🛒 **Handle Remove Service**
  const handleRemoveService = (service) => {
    setForm((prev) => {
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
    Object.values(form.cart).reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getTotalItems = () =>
    Object.values(form.cart).reduce((sum, item) => sum + item.quantity, 0);

  // 📤 **Submit Booking**
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in to create a booking.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid, // Always required
        location: location
          ? {
              coordinates: location,
              mainAddress: form.address || 'Not provided',
              details: {
                houseNumber: form.houseNumber || 'N/A',
                addressNumber: form.addressNumber || 'N/A',
                street: form.street || 'N/A',
                estate: form.estate || 'N/A',
              },
            }
          : null,
        phone: form.phone || 'Not provided',
        cart: Object.keys(form.cart).length > 0 ? form.cart : { message: 'No services selected' },
        total: calculateTotal() || 0,
        createdAt: new Date(),
        status: 'pending',
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
      <h1>Premium Car Wash Services</h1>
      {error && <div className="error">{error}</div>}

      <section>
        <h2>Location</h2>
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '400px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler setLocation={setLocation} />
          {location && <Marker position={[location.lat, location.lng]} />}
        </MapContainer>
        <LocationInput label="Address" placeholder="Enter address" value={form.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} />
      </section>

      <section>
        <h2>Services</h2>
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} quantity={form.cart[service.id]?.quantity || 0} onAdd={handleAddService} onRemove={handleRemoveService} />
        ))}
      </section>

      <button onClick={() => setShowCart(!showCart)}>
        <ShoppingCart size={24} />
        {getTotalItems() > 0 && <span>{getTotalItems()}</span>}
      </button>

      {showCart && (
        <div>
          <h3>Total: KES {calculateTotal()}</h3>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Booking;




