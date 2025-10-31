import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import AdminLogin from './pages/AdminLogin';
import Onboarding from './pages/Onboarding';
import UserSettings from './pages/UserSettings';
import SuggestFit from './pages/SuggestFit';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/suggest" element={<SuggestFit />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
