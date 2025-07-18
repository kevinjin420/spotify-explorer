// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider'; // Import AuthProvider
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard"
import './App.css'

export default function App() {
  return (
    <Router>
      <AuthProvider> 
        <div className="app-container">
          <main className="content bg-black">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stats" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}