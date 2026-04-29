import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Player from './pages/Player';
import Admin from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AuthCallback from './pages/AuthCallback';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
