import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMemos, updateMemo, sendNotification, getUsers } from "../services/api";
import { Link } from "react-router-dom";

export default function Staff() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const user = JSON.parse(localStorage.getItem("user")); // Logged-in Staff

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const memosRes = await getMemos();
    const usersRes = await getUsers();

    // Filter memos assigned to this staff
    const staffMemos = memosRes.data.filter((memo) =>
      memo.staffAssigned.some((s) => s.id === user.id)
    );

    setMemos(staffMemos);
    setUsers(usersRes.data);
  };

  const handleUpdateTask = async (memo) => {
    const updatedStaff = memo.staffAssigned.map((s) => {
      if (s.id === user.id) {
        return {
          ...s,
          status: "Completed",
          proof: proofFile ? [...(s.proof || []), proofFile.name] : s.proof || [],
          comments: comment ? [...(s.comments || []), comment] : s.comments || [],
        };
      }
      return s;
    });

    await updateMemo(memo.id, {
      staffAssigned: updatedStaff,
      status: "Completed",
    });

    // Notify Dept Head
    sendNotification(
      memo.assignedTo,
      `${user.name} updated task "${memo.title}" to Completed`
    );

    setComment("");
    setProofFile(null);
    loadData();
  };

  // Overall evaluation calculation
  const calculateOverallEvaluation = () => {
    let totalPoints = 0,
      totalRating = 0,
      badgeList = [];
    let taskCount = 0;

    memos.forEach((memo) => {
      const myTask = memo.staffAssigned.find((s) => s.id === user.id);
      if (myTask) {
        if (myTask.points) totalPoints += Number(myTask.points);
        if (myTask.rating) totalRating += Number(myTask.rating);
        if (myTask.badges) badgeList = [...badgeList, ...myTask.badges];
        taskCount++;
      }
    });

    return {
      avgPoints: taskCount ? (totalPoints / taskCount).toFixed(2) : 0,
      avgRating: taskCount ? (totalRating / taskCount).toFixed(2) : 0,
      badges: [...new Set(badgeList)],
    };
  };

  const overall = calculateOverallEvaluation();

  const getUserNameById = (id) => {
    const u = users.find((usr) => usr.id.toString() === id.toString());
    return u ? u.name : "Unknown";
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>{user.department} Staff Panel</h2>
        <Link to="/notifications" className="btn btn-outline-secondary mb-3">
          🔔 Notifications
        </Link>

        {/* Overall Evaluation */}
        <div className="card p-3 mb-4 shadow-sm bg-light">
          <h5>📊 Overall Evaluation</h5>
          <p><strong>Average Points:</strong> {overall.avgPoints}</p>
          <p><strong>Average Rating:</strong> {overall.avgRating}</p>
          <p><strong>Badges Earned:</strong> {overall.badges.join(", ") || "None"}</p>
        </div>

        {memos.length === 0 && <p>No tasks assigned yet.</p>}

        {memos.map((memo) => {
          const myTask = memo.staffAssigned.find((s) => s.id === user.id);
          return (
            <div key={memo.id} className="card p-3 mb-3 shadow-sm">
              <h5>{memo.title}</h5>
              <p>{memo.description}</p>
              <p>
                <strong>Status:</strong> {myTask.status || "Pending"}
              </p>
              <p>
                <strong>Priority:</strong> {memo.priority} |{" "}
                <strong>Deadline:</strong> {memo.deadline}
              </p>
              <p>
                <strong>Task By:</strong> {getUserNameById(memo.assignedTo)}
              </p>

              {/* Update Section */}
              {myTask.status !== "Completed" && (
                <>
                  <input
                    type="text"
                    placeholder="Add comment"
                    className="form-control mb-2"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <input
                    type="file"
                    className="form-control mb-2"
                    onChange={(e) => setProofFile(e.target.files[0])}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateTask(memo)}
                  >
                    Mark Completed
                  </button>
                </>
              )}

              {/* Show Comments & Proof */}
              {myTask.comments?.length > 0 && (
                <p>
                  <strong>Comments:</strong> {(myTask.comments || []).join(", ")}
                </p>
              )}
              {myTask.proof?.length > 0 && (
                <p>
                  <strong>Proof:</strong> {(myTask.proof || []).join(", ")}
                </p>
              )}

              {/* Evaluation */}
              {myTask.points > 0 || myTask.rating > 0 || (myTask.badges?.length > 0) ? (
                <div className="mt-3 p-2 border rounded bg-light">
                  <h6>Evaluation:</h6>
                  <p><strong>Points:</strong> {myTask.points || 0}</p>
                  <p><strong>Rating:</strong> {myTask.rating || 0}</p>
                  <p><strong>Badges:</strong> {(myTask.badges || []).join(", ") || "None"}</p>
                </div>
              ) : (
                <p className="text-muted">No evaluation yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
