import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GameContainer from './GameContainer';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameContainer />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
