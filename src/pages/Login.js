import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await loginUser(email, password);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      if(user.role==="Admin") navigate("/admin");
      if(user.role==="Head") navigate("/head");
      if(user.role==="Staff") navigate("/staff");
    } else alert("Invalid credentials!");
  };

  return (
    <div className="container mt-5" style={{maxWidth:"400px"}}>
      <h3>Login</h3>
      <form onSubmit={handleLogin}>
        <input type="email" className="form-control mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input type="password" className="form-control mb-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <button className="btn btn-primary w-100">Login</button>
      </form>
    </div>
  );
}
