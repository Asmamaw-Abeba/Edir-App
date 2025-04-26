import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Members from './pages/Members';
import Contributions from './pages/Contributions';
import Events from './pages/Events';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotContact from './pages/ForgotContact';
import ResetContact from './pages/ResetContact';
import FeedbackPage from './pages/FeedbackPage';
import AdminDashboard from './admin/AdminDashboard';
import AdminEventPage from './admin/AdminEventPage';

import NotFound from './components/404';

function App() {
  const location = useLocation();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };


  return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/members" element={<Members />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contributions" element={<Contributions events={events}/>} />
          <Route path="/events" element={<Events />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-contact" element={<ForgotContact />} />
          <Route path="/reset-contact" element={<ResetContact />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/events" element={<AdminEventPage />} />

          <Route path="*" element={<NotFound />} /> {/* Catch-all route for 404 */}
        </Routes>
      </AnimatePresence>
  );
}  

export default App;