import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

const AppNavigator = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/" element={<div>Home Screen</div>} />
    </Routes>
  </Router>
);

export default AppNavigator;
