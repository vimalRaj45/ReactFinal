import { useState } from "react";

export default function MemoForm({ onCreate, users }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skillType: "",
    priority: "Low",
    deadline: "",
    assignedTo: ""
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
    setForm({ title: "", description: "", skillType: "", priority: "Low", deadline: "", assignedTo: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <input className="form-control mb-2" name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <textarea className="form-control mb-2" name="description" placeholder="Description" value={form.description} onChange={handleChange}></textarea>
      <input className="form-control mb-2" name="skillType" placeholder="Skill Type" value={form.skillType} onChange={handleChange} />
      <select className="form-control mb-2" name="priority" value={form.priority} onChange={handleChange}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <input type="date" className="form-control mb-2" name="deadline" value={form.deadline} onChange={handleChange} />
      <select className="form-control mb-2" name="assignedTo" value={form.assignedTo} onChange={handleChange}>
        <option value="">Select Department Head</option>
        {users.filter(u => u.role === "Head").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <button className="btn btn-primary w-100">Create Memo</button>
    </form>
  );
}
