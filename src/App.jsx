import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  BottomNavigation, 
  BottomNavigationAction, 
  useMediaQuery,
  Box,
  Container
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/Book';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import StarIcon from '@mui/icons-material/Star';

import Home from './Home';
import Booking from './Booking';
import Tracking from './Tracking';
import About from './About';
import Team from './Team';
import Contact from './Contact';
import Testimonials from './Testimonials';
import Login from './Login';
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navValue, setNavValue] = useState(0);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const navigate = useNavigate();

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false);
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const navigationItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Booking', icon: <BookIcon />, path: '/booking' },
    { label: 'Tracking', icon: <MapIcon />, path: '/tracking' },
    { label: 'About', icon: <InfoIcon />, path: '/about' },
    { label: 'Team', icon: <PeopleIcon />, path: '/team' },
    { label: 'Contact', icon: <ContactMailIcon />, path: '/contact' },
    { label: 'Testimonials', icon: <StarIcon />, path: '/testimonials' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ backgroundColor: '#f7c12d', color: '#000' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Car wash
          </Typography>
          <Button color="inherit" onClick={handleLoginLogout}>
            {isLoggedIn ? 'Logout' : 'Login/Register'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Navigation for Desktop */}
      {!isMobile && (
        <Box sx={{ backgroundColor: '#f7c12d', padding: '10px 0' }}>
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              {navigationItems.map((item, index) => (
                <Button
                  key={item.label}
                  startIcon={item.icon}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  onClick={() => setNavValue(index)}
                  sx={{
                    color: navValue === index ? '#fff' : '#000',
                    '&:hover': { color: '#fff' }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Container sx={{ flex: 1, padding: '20px', marginTop: '20px', marginBottom: isMobile ? '56px' : '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Container>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <BottomNavigation
          value={navValue}
          onChange={(event, newValue) => {
            setNavValue(newValue);
            navigate(navigationItems[newValue].path);
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            backgroundColor: '#f7c12d',
            '& .MuiBottomNavigationAction-root': {
              color: '#000',
              '&.Mui-selected': {
                color: '#fff'
              }
            }
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

const Root = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default Root;
