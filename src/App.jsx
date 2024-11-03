import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './App/SignUp';
import SignIn from './App/SignIn';
import { useAuth, AuthProvider } from './App/AuthContext';
import CreateList from './App/CreateList';
import ListDetail from './App/modals/ListDetail';

function App() {
  const { user, signOut } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="App">
      {!user ? (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
          <div className="card p-4" style={{ width: '400px' }}>
            <h2 className="text-center mb-4">
              {showSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            {showSignUp ? <SignUp /> : <SignIn />}
            <div className="text-center mt-3">
              <button
                className="btn btn-link"
                onClick={() => setShowSignUp(!showSignUp)}
              >
                {showSignUp
                  ? '¿Tenés cuenta? Inicia sesión'
                  : '¿No tenés cuenta? Registrate'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <nav className="navbar navbar-expand-lg navbar-light">
            <div className="container-fluid">
              <h5 className="navbar-brand">Listas de: {user.email}</h5>
              <button
                className="btn btn-outline-danger ms-auto"
                onClick={signOut}
              >
                Cerrar Sesión
              </button>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={
              <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <CreateList />
              </div>
            } />
            <Route path="/list/:listId" element={
                <ListDetail />
            } />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}



