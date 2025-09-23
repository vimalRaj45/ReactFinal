import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import {
  getMemos,
  getUsers,
  updateMemo,
  updateUser,
  sendNotification,
} from "../services/api";

export default function Head() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState({});
  const [staffEvaluation, setStaffEvaluation] = useState({});

  const user = JSON.parse(localStorage.getItem("user")); // Logged-in Dept Head

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const memosRes = await getMemos();
      const deptMemos = memosRes.data.filter((m) => m.assignedTo === user.id);
      setMemos(deptMemos);

      const usersRes = await getUsers();
      const deptStaff = usersRes.data.filter(
        (u) => u.role === "Staff" && u.department === user.department
      );
      setUsers(deptStaff);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  // Assign staff to memo
  const assignStaff = async (memoId) => {
    const staffId = selectedStaff[memoId];
    if (!staffId) return alert("Please select a staff to assign.");

    const staffObject = users.find((s) => s.id.toString() === staffId.toString());
    if (!staffObject) return alert("Staff not found.");

    await updateMemo(memoId, { staffAssigned: [staffObject] });

    const memoTitle = memos.find((m) => m.id === memoId)?.title || "";
    await sendNotification(
      staffObject.id,
      `You have been assigned a new task: "${memoTitle}"`
    );

    alert(`Notification sent to ${staffObject.name}`);
    setSelectedStaff({ ...selectedStaff, [memoId]: null });
    loadData();
  };

  // Dept Head verifies task
  const verifyTask = async (memoId) => {
    await updateMemo(memoId, { status: "Verified" });
    const memo = memos.find((m) => m.id === memoId);

    (memo.staffAssigned || []).forEach(async (s) => {
      await sendNotification(
        s.id,
        `Your task "${memo.title}" has been verified by Dept Head`
      );
      alert(`Notification sent to ${s.name}`);
    });

    loadData();
  };

  const handleEvaluationChange = (memoId, staffId, field, value) => {
    setStaffEvaluation((prev) => ({
      ...prev,
      [memoId]: {
        ...prev[memoId],
        [staffId]: {
          ...prev[memoId]?.[staffId],
          [field]: value,
        },
      },
    }));
  };

  const submitEvaluation = async (memoId, staffId) => {
    const evaluation = staffEvaluation[memoId]?.[staffId];
    if (!evaluation) return alert("Please fill evaluation details.");

    const memo = memos.find((m) => m.id === memoId);

    // Update staff inside memo
    const updatedStaff = (memo.staffAssigned || []).map((s) =>
      s.id === staffId
        ? {
            ...s,
            points: Number(evaluation.points) || 0,
            rating: Number(evaluation.rating) || 0,
            badges: evaluation.badges
              ? evaluation.badges.split(",").map((b) => b.trim())
              : [],
          }
        : s
    );

    await updateMemo(memoId, { staffAssigned: updatedStaff });

    // Update user profile too
    const userToUpdate = users.find((u) => u.id === staffId);
    if (userToUpdate) {
      const updatedUser = {
        ...userToUpdate,
        points: Number(evaluation.points) || 0,
        rating: Number(evaluation.rating) || 0,
        badges: evaluation.badges
          ? evaluation.badges.split(",").map((b) => b.trim())
          : [],
      };
      await updateUser(staffId, updatedUser);
    }

    // Send notification
    await sendNotification(
      staffId,
      `Your task "${memo.title}" has been evaluated by Dept Head. Points: ${evaluation.points}, Rating: ${evaluation.rating}, Badges: ${evaluation.badges}`
    );

    alert("Evaluation submitted successfully!");
    loadData();
  };

  // Helper: Check if assignment can be changed
  const canAssign = (memo) => {
    if (!memo.staffAssigned || memo.staffAssigned.length === 0) return true;
    const deadline = new Date(memo.deadline);
    const today = new Date();
    return today > deadline; // allow assignment change only after deadline
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>{user.department} Dept Head Panel</h2>
        <Link to="/notifications" className="btn btn-outline-secondary mb-3">
          🔔 Notifications
        </Link>

        {memos.length === 0 && <p>No memos assigned.</p>}

        {memos.map((memo) => (
          <div key={memo.id} className="card p-3 mb-3 shadow-sm">
            <h5>{memo.title}</h5>
            <p>{memo.description}</p>
            <p>
              <strong>Status:</strong> {memo.status || "Pending"} |{" "}
              <strong>Priority:</strong> {memo.priority} |{" "}
              <strong>Deadline:</strong> {memo.deadline}
            </p>

            {/* Assign staff */}
            <div className="mb-2">
              <label>Select Staff:</label>
              <select
                className="form-control"
                value={selectedStaff[memo.id] || ""}
                onChange={(e) =>
                  setSelectedStaff({
                    ...selectedStaff,
                    [memo.id]: e.target.value,
                  })
                }
                disabled={!canAssign(memo)}
              >
                <option value="">-- Select Staff --</option>
                {users.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => assignStaff(memo.id)}
                disabled={!canAssign(memo)}
              >
                {canAssign(memo) ? "Assign" : "Assigned (Deadline not passed)"}
              </button>
            </div>

            {/* Verify task button */}
            {memo.status !== "Verified" && (
              <button
                className="btn btn-success mt-2"
                onClick={() => verifyTask(memo.id)}
              >
                Verify Task
              </button>
            )}

            {/* Show assigned staff */}
            <p className="mt-2">
              <strong>Staff Assigned:</strong>{" "}
              {(memo.staffAssigned || []).map((s) => s.name).join(", ")}
            </p>

            {/* ⭐ Evaluation after Admin verification */}
            {memo.status === "Verified" &&
              memo.adminVerified &&
              (memo.staffAssigned || []).map((s) => (
                <div key={s.id} className="mt-3 p-2 border rounded bg-light">
                  <strong>{s.name} Evaluation:</strong>
                  <div className="mb-1">
                    <input
                      type="number"
                      placeholder="Points"
                      className="form-control mb-1"
                      value={staffEvaluation[memo.id]?.[s.id]?.points || ""}
                      onChange={(e) =>
                        handleEvaluationChange(
                          memo.id,
                          s.id,
                          "points",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="number"
                      placeholder="Rating"
                      className="form-control mb-1"
                      value={staffEvaluation[memo.id]?.[s.id]?.rating || ""}
                      onChange={(e) =>
                        handleEvaluationChange(
                          memo.id,
                          s.id,
                          "rating",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      placeholder="Badges (comma separated)"
                      className="form-control"
                      value={staffEvaluation[memo.id]?.[s.id]?.badges || ""}
                      onChange={(e) =>
                        handleEvaluationChange(
                          memo.id,
                          s.id,
                          "badges",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => submitEvaluation(memo.id, s.id)}
                  >
                    Submit Evaluation
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
