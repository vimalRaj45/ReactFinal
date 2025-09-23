import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getMemos, getUsers, updateMemo, sendNotification, createMemo } from "../services/api";

export default function Admin() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMemo, setNewMemo] = useState({
    title: "",
    description: "",
    skillType: "",
    priority: "",
    deadline: "",
    assignedTo: ""
  });

  const user = JSON.parse(localStorage.getItem("user")); // Logged-in Admin

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const memosRes = await getMemos();
    setMemos(memosRes.data);

    const usersRes = await getUsers();
    const heads = usersRes.data.filter(u => u.role === "Head"); // only Dept Heads
    setUsers(heads);
  };

  // Admin verifies memo
  const adminVerify = async (memoId) => {
    await updateMemo(memoId, { adminVerified: true });
    const memo = memos.find(m => m.id === memoId);
    (memo.staffAssigned || []).forEach(async (s) => {
      await sendNotification(s.id, `Admin has verified task "${memo.title}"`);
      alert(`Notification sent to ${s.name}`);
    });
    loadData();
  };

  // Handle new memo input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMemo({ ...newMemo, [name]: value });
  };

  // Submit new memo
  const handleCreateMemo = async () => {
    if (!newMemo.title || !newMemo.description || !newMemo.assignedTo) {
      return alert("Please fill all required fields.");
    }

    const memoToCreate = {
      ...newMemo,
      status: "Pending",
      staffAssigned: [],
      adminVerified: false,
    };

    await createMemo(memoToCreate);
    alert("New memo created successfully!");

    // Notify Dept Head
    await sendNotification(
      newMemo.assignedTo,
      `New memo assigned: ${newMemo.title}`
    );

    setNewMemo({
      title: "",
      description: "",
      skillType: "",
      priority: "",
      deadline: "",
      assignedTo: ""
    });

    loadData();
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>Admin Panel</h2>

        {/* --- Create New Memo --- */}
        <div className="card p-3 mb-4 shadow-sm">
          <h5>Create New Memo</h5>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Title"
              name="title"
              className="form-control mb-2"
              value={newMemo.title}
              onChange={handleInputChange}
            />
            <textarea
              placeholder="Description"
              name="description"
              className="form-control mb-2"
              value={newMemo.description}
              onChange={handleInputChange}
            />
            <input
              type="text"
              placeholder="Skill Type"
              name="skillType"
              className="form-control mb-2"
              value={newMemo.skillType}
              onChange={handleInputChange}
            />
            <select
              name="priority"
              className="form-control mb-2"
              value={newMemo.priority}
              onChange={handleInputChange}
            >
              <option value="">-- Select Priority --</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input
              type="date"
              name="deadline"
              className="form-control mb-2"
              value={newMemo.deadline}
              onChange={handleInputChange}
            />
            <select
              name="assignedTo"
              className="form-control mb-2"
              value={newMemo.assignedTo}
              onChange={handleInputChange}
            >
              <option value="">-- Assign to Dept Head --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleCreateMemo}>
              Create Memo
            </button>
          </div>
        </div>

        {memos.length === 0 && <p>No memos available.</p>}

        {memos.map((memo) => (
          <div key={memo.id} className="card p-3 mb-3 shadow-sm">
            <h5>{memo.title}</h5>
            <p>{memo.description}</p>
            <p>
              <strong>Status:</strong> {memo.status || "Pending"} |{" "}
              <strong>Dept Verified:</strong> {memo.status === "Verified" ? "Yes" : "No"} |{" "}
              <strong>Admin Verified:</strong> {memo.adminVerified ? "Yes" : "No"}
            </p>

            {/* Admin verification */}
            {!memo.adminVerified && memo.status === "Verified" && (
              <button className="btn btn-success" onClick={() => adminVerify(memo.id)}>
                Admin Verify
              </button>
            )}

            {/* Evaluation visibility info */}
            {(memo.status !== "Verified" || !memo.adminVerified) && (
              <p className="text-muted mt-2">
                Evaluation visible only after Dept Head & Admin verification
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
