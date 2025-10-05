import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages (to be created)
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import CallHistory from './pages/CallHistory';
import CallDetails from './pages/CallDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Layout components
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/history" element={<CallHistory />} />
            <Route path="/calls/:id" element={<CallDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
