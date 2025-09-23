import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Head from "./pages/Head";
import Staff from "./pages/Staff";
import Notifications from "./components/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Admin dashboard */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="Admin">
              <Admin />
            </ProtectedRoute>
          } 
        />

        {/* Department Head dashboard */}
        <Route 
          path="/head" 
          element={
            <ProtectedRoute role="Head">
              <Head />
            </ProtectedRoute>
          } 
        />

        {/* Staff dashboard */}
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute role="Staff">
              <Staff />
            </ProtectedRoute>
          } 
        />

        {/* Notifications route accessible to all logged-in users */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
