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

function getSavedSale() {
  try {
    const savedSale = sessionStorage.getItem(
      'pos_last_sale'
    );

    if (!savedSale) {
      return null;
    }

    const sale = JSON.parse(savedSale);

    if (
      !sale ||
      !sale.receiptNumber ||
      !Array.isArray(sale.items) ||
      sale.items.length === 0
    ) {
      sessionStorage.removeItem('pos_last_sale');
      return null;
    }

    return sale;
  } catch {
    sessionStorage.removeItem('pos_last_sale');
    return null;
  }
}

function PosRoutes({
  user,
  onLogout
}) {
  const navigate = useNavigate();

  function handleCheckoutSuccess(result) {
    /*
     * PosPage currently calls onCheckoutSuccess with:
     *
     * {
     *   sale: completedSale,
     *   receiptNumber: completedSale.receiptNumber
     * }
     *
     * Support both that object and a direct sale object,
     * so this remains safe if the POS page changes later.
     */
    const sale = result?.sale || result;

    if (
      !sale ||
      !sale.receiptNumber ||
      !Array.isArray(sale.items) ||
      sale.items.length === 0
    ) {
      console.error(
        'Cannot open receipt: incomplete sale data.',
        result
      );

      return;
    }

    sessionStorage.setItem(
      'pos_last_sale',
      JSON.stringify(sale)
    );

    navigate('/receipt');
  }

  function handleReceiptBack() {
    sessionStorage.removeItem('pos_last_sale');

    navigate('/', {
      replace: true
    });
  }

  const savedSale = getSavedSale();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PosPage
            user={user}
            onLogout={onLogout}
            onCheckoutSuccess={
              handleCheckoutSuccess
            }
          />
        }
      />

      <Route
        path="/receipt"
        element={
          savedSale ? (
            <ReceiptPage
              sale={savedSale}
              onBack={handleReceiptBack}
            />
          ) : (
            <Navigate
              to="/"
              replace
            />
          )
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
    sessionStorage.removeItem('pos_last_sale');

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