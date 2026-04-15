import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DailyCheckIn from './pages/DailyCheckIn';
import AnalysisLoading from './pages/AnalysisLoading';
import Results from './pages/Results';
import Timeline from './pages/Timeline';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkin" element={<DailyCheckIn />} />
        <Route path="/analysis/:checkInId" element={<AnalysisLoading />} />
        <Route path="/results/:checkInId" element={<Results />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Onboarding />} />
      </Routes>
    </Router>
  );
}

export default App;