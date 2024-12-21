import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'John Doe',
      feedback: 'This service is fantastic! Highly recommended.',
      img: 'https://via.placeholder.com/100',
    },
    {
      name: 'Jane Smith',
      feedback: 'Very reliable and efficient. A+ experience.',
      img: 'https://via.placeholder.com/100',
    },
    {
      name: 'Samuel Green',
      feedback: 'Great customer support and amazing features.',
      img: 'https://via.placeholder.com/100',
    },
  ];

  return (
    <div className="testimonials-container">
      <h1>What Our Clients Say</h1>
      <div className="testimonials-grid">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-card">
            <img src={testimonial.img} alt={`${testimonial.name}`} />
            <h3>{testimonial.name}</h3>
            <p>"{testimonial.feedback}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
