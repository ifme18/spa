import React from 'react';
import './Team.css';

const Team = () => {
  const teamMembers = [
    { name: 'Joel Maina', role: 'CEO', img: 'https://via.placeholder.com/150' },
    { name: 'Wamuyu Maina', role: 'CTO', img: 'https://via.placeholder.com/150' },
    { name: '', role: 'Designer', img: 'https://via.placeholder.com/150'},
    { name: '', role: 'Developer', img: 'https://via.placeholder.com/150' },
  ];

  return (
    <div className="team-container">
      <h1>Meet Our Team</h1>
      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <div key={index} className="team-card">
            <img src={member.img} alt={`${member.name}`} />
            <h3>{member.name}</h3>
            <p>{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
