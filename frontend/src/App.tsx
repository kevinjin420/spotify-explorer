// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard"
import './App.css'

export default function App() {
  return (
    <Router>
      <div className="app-container bg-black w-full h-full">
        <main>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Home />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}