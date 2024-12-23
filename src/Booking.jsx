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

    if (!location || !form.phone || Object.keys(form.cart).length === 0) {
      alert('Please select a location, provide a phone number, and select services.');
      return;
    }

    const locationDetails = {
      coordinates: location,
      mainAddress: form.address,
      details: {
        houseNumber: form.houseNumber,
        addressNumber: form.addressNumber,
        street: form.street,
        estate: form.estate,
      }
    };

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        location: locationDetails,
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

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Services</h3>
        <div className="space-y-2">
          {servicesList.map((service) => (
            <div key={service.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{service.name} - Ksh {service.price}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateCart(service, false)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >-</button>
                <span className="w-8 text-center">{form.cart[service.name]?.quantity || 0}</span>
                <button 
                  onClick={() => updateCart(service, true)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6" ref={cartRef}>
        <button 
          onClick={() => setShowCart(!showCart)}
          className="w-full p-2 bg-blue-500 text-white rounded mb-2"
        >
          {showCart ? 'Hide Cart' : 'View Cart'} ({getTotalItems()} items)
        </button>
        {showCart && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Cart Summary</h3>
            <ul className="space-y-2">
              {Object.entries(form.cart).map(([name, item]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>{item.quantity} x Ksh {item.price} = Ksh {item.quantity * item.price}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-2 border-t">
              <h4 className="font-semibold">Total: Ksh {calculateTotal()}</h4>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full p-3 bg-green-500 text-white rounded font-semibold hover:bg-green-600"
      >
        Confirm Booking
      </button>

      <div className="mt-8">
        {user ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Your Bookings</h3>
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="border p-4 rounded">
                    <p><strong>Address:</strong> {booking.location.mainAddress}</p>
                    {booking.location.details.houseNumber && (
                      <p><strong>House Number:</strong> {booking.location.details.houseNumber}</p>
                    )}
                    {booking.location.details.street && (
                      <p><strong>Street:</strong> {booking.location.details.street}</p>
                    )}
                    {booking.location.details.estate && (
                      <p><strong>Estate:</strong> {booking.location.details.estate}</p>
                    )}
                    <p><strong>Total:</strong> Ksh {booking.total}</p>
                    <p><strong>Created At:</strong> {new Date(booking.createdAt.seconds * 1000).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No bookings found.</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Please log in to view your bookings.</p>
        )}
      </div>
    </div>
  );
};

export default Booking;

