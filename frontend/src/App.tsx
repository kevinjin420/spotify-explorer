import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import './App.css'

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="content bg-black">
          <Navbar />
          <Routes >
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
