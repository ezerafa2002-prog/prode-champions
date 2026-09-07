import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Fixture from "./pages/Fixture";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jugar" element={<Play />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/jugador/:slug" element={<Profile />} />
      <Route path="/fixture" element={<Fixture />} />
    </Routes>
  );
}
