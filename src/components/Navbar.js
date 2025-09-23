import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">Hospital Memo</Link>
        <div className="ms-auto">
          {user && <span className="text-light me-3">{user.name} ({user.role})</span>}
          {user && <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>}
        </div>
      </div>
    </nav>
  );
}
