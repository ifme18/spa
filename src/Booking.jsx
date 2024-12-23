import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { auth, db } from './Firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const servicesList = [
  { name: 'Normal Car Wash', price: 300 },
  { name: 'Engine Wash', price: 300 },
  { name: 'Underwash', price: 500 },
  { name: 'Seat Cleaning (per seat)', price: 500 },
  { name: 'Carpet Cleaning (per sq ft)', price: 30 },
];

// Map click handler component
function MapClickHandler({ setLocation }) {
  useMapEvents({
    click: (e) => {
      setLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
}

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
  const [userBookings, setUserBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const cartRef = useRef(null);

  // Default center coordinates for Nairobi
  const defaultCenter = {
    lat: -1.286389,
    lng: 36.817223
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
  
    if (!form.phone || Object.keys(form.cart).length === 0) {
      alert('Please provide a phone number and select services.');
      return;
    }
  
    // Proceed even if location is not selected
    const locationDetails = location
      ? {
          coordinates: location,
          mainAddress: form.address,
          details: {
            houseNumber: form.houseNumber,
            addressNumber: form.addressNumber,
            street: form.street,
            estate: form.estate,
          },
        }
      : null;
  
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        location: locationDetails,  // Can be null if location is not provided
        phone: form.phone,
        cart: form.cart,
        total: calculateTotal(),
        createdAt: new Date(),
      });
      alert('Booking confirmed!');
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
      fetchUserBookings(user);
    } catch (error) {
      console.error('Error adding booking:', error);
      setError('Failed to confirm booking. Please try again.');
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
    <div className="booking relative p-4">
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

      <h1 className="text-2xl font-bold mb-6">Book a Cleaning Service</h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Location</h3>
        <div style={{ height: '300px' }}>
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler setLocation={setLocation} />
            {location && <Marker position={[location.lat, location.lng]} />}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <h3 className="text-lg font-semibold col-span-full">Location Details</h3>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Main Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-2 border rounded"
          />
          
          <input
            type="text"
            placeholder="House Number (optional)"
            value={form.houseNumber}
            onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            placeholder="Address Number (optional)"
            value={form.addressNumber}
            onChange={(e) => setForm({ ...form, addressNumber: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Street Name (optional)"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            placeholder="Estate Name (optional)"
            value={form.estate}
            onChange={(e) => setForm({ ...form, estate: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <input
            type="tel"
            placeholder="Phone Number *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Select Services</h3>
      <div className="space-y-2">
        {servicesList.map((service) => (
          <div key={service.name} className="flex justify-between items-center">
            <span>{service.name}</span>
            <div className="flex items-center">
              <button 
                onClick={() => updateCart(service, true)} 
                className="bg-blue-500 text-white px-2 py-1 rounded-md mr-2"
              >
                Add
              </button>
              <button 
                onClick={() => updateCart(service, false)} 
                className="bg-red-500 text-white px-2 py-1 rounded-md"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div ref={cartRef} className="mt-8">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="font-semibold text-xl">{calculateTotal()} KES</span>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default Booking;



