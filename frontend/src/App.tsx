import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css'

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="content bg-gray-800">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
