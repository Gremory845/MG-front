import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import CategoriesPage from './pages/CategoriesPage'
import FamiliesPage from './pages/FamiliesPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import LevelsPage from './pages/LevelsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ScalesPage from './pages/ScalesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<CategoriesPage />} />
          <Route path="/c/:category" element={<FamiliesPage />} />
          <Route path="/c/:category/:family" element={<ScalesPage />} />
          <Route path="/scales/:scaleId" element={<LevelsPage />} />
          <Route path="/play/:levelId" element={<GamePage />} />
          <Route path="/leaderboard/:levelId" element={<LeaderboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
