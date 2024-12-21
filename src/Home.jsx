import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'// Add styling here or use a CSS framework

const Home = () => {
  return (
    <div className="home">
      <header className="hero">
        <h1>Welcome to CleanPro Services</h1>
        <p>Your trusted partner for all cleaning needs!</p>
        <div className="cta-buttons">
          <Link to="/booking">
            <button className="btn">Book a Service</button>
          </Link>
          <Link to="/tracking">
            <button className="btn">Track an Order</button>
          </Link>
        </div>
      </header>

      <section className="services">
        <h2>Our Services</h2>
        <div className="service-cards">
          <div className="card">
            <h3>Car Wash</h3>
            <p>Choose from Full, Half, or Minor Body Wash.</p>
          </div>
          <div className="card">
            <h3>House Cleaning</h3>
            <p>Chairs, Carpets, and more.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
