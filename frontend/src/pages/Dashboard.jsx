// frontend/src/pages/Dashboard.jsx - UPDATED
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API, getAuthHeaders } from "../config/api";

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // fetch user profile is no longer needed here if user object contains all info
    // However, if we need fresh data from server, we can still fetch.
    fetch(`${API.AUTH}/me`, {
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          logout(); // Use the provided logout function
          navigate("/login");
          return;
        }
        const data = await res.json();
        // The user is already in context, but we can update it if needed.
        // setMe(data);
      })
      .catch(() => setMsg("Network error"));

  }, [navigate, isAuthenticated, logout]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Welcome, <b>{user.name}</b> ({user.email})</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>{msg || "Loading..."}</p>
      )}
    </div>
  );
}