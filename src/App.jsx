import { useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import ReceiptPage from './pages/ReceiptPage';

import {
  getCurrentUser,
  logout
} from './api/auth';

function PosRoutes({
  user,
  onLogout
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PosPage
            user={user}
            onLogout={onLogout}
            onCheckoutSuccess={sale => {
              sessionStorage.setItem(
                'pos_last_sale',
                JSON.stringify(sale)
              );

              navigate('/receipt');
            }}
          />
        }
      />

      <Route
        path="/receipt"
        element={
          <ReceiptPage
            sale={(() => {
              const savedSale =
                sessionStorage.getItem(
                  'pos_last_sale'
                );

              return savedSale
                ? JSON.parse(savedSale)
                : null;
            })()}
            onBack={() => {
              sessionStorage.removeItem(
                'pos_last_sale'
              );

              navigate('/');
            }}
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(() =>
    getCurrentUser()
  );

  function handleLoggedIn(account) {
    setUser(account);
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <LoginPage
              onLoggedIn={handleLoggedIn}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    );
  }

  return (
    <PosRoutes
      user={user}
      onLogout={handleLogout}
    />
  );
}