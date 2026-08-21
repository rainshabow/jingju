import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PlayDetail from './pages/PlayDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/play/:id" element={<PlayDetail />} />
    </Routes>
  );
}
