import React from 'react';
import AppRouter from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppRouter />
      <ToastContainer 
        position="top-center" 
        autoClose={3000} 
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName="!rounded-2xl !shadow-2xl"
        style={{ zIndex: 999999 }}
      />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
