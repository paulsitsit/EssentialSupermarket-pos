import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import ReceiptPage from './pages/ReceiptPage';
import { getCurrentUser, logout } from './api/auth';

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());

  function handleLoggedIn(newUser) {
    setUser(newUser);
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage onLoggedIn={handleLoggedIn} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PosPage
            user={user}
            onLogout={handleLogout}
            onCheckoutSuccess={(sale) => {
              // Navigate to receipt page by storing sale in sessionStorage
              sessionStorage.setItem('pos_last_sale', JSON.stringify(sale));
              window.location.hash = '#/receipt';
            }}
          />
        }
      />
      <Route
        path="/receipt"
        element={
          <ReceiptPage
            sale={(() => {
              const s = sessionStorage.getItem('pos_last_sale');
              return s ? JSON.parse(s) : null;
            })()}
            onBack={() => {
              sessionStorage.removeItem('pos_last_sale');
              window.location.hash = '#/';
            }}
          />
        }
      />
    </Routes>
  );
}