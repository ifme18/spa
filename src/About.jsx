import React from 'react';

const About = () => {
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#6a0dad', // Purple background
      color: '#ffffff', // White text for contrast
      textAlign: 'center',
      borderRadius: '12px',
      maxWidth: '800px',
      margin: '50px auto',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: '20px',
      }}>About Us</h1>
      
      <p style={{
        fontSize: '1.1rem',
        lineHeight: '1.6',
        marginBottom: '30px',
      }}>
        Welcome to our company! We are dedicated to delivering exceptional services with a focus on quality, innovation, and customer satisfaction. Our team is committed to exceeding your expectations every step of the way.
      </p>

      <button style={{
        padding: '10px 20px',
        fontSize: '1rem',
        color: '#6a0dad',
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#d9c2f4'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
      >
        Learn More
      </button>
    </div>
  );
};

export default About;


