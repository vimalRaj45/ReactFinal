export default function TaskList({ memos, onStatusChange, onRate, showStaff=false }) {
  return (
    <div>
      {memos.map(m => (
        <div key={m.id} className="card p-3 mb-2">
          <h5>{m.title}</h5>
          <p>{m.description}</p>
          <p>Priority: {m.priority} | Skill: {m.skillType}</p>
          <p>Status: {m.status} | Deadline: {m.deadline}</p>
          {showStaff && m.staffAssigned && <p>Staff Assigned: {m.staffAssigned.map(s => s.name).join(", ")}</p>}
          {onStatusChange && (
            <>
              {m.status === "Pending" && <button className="btn btn-warning me-2" onClick={() => onStatusChange(m.id, "In Progress")}>Start</button>}
              {m.status === "In Progress" && <button className="btn btn-success" onClick={() => onStatusChange(m.id, "Completed")}>Complete</button>}
            </>
          )}
          {onRate && (
            <div className="mt-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} className="btn btn-sm btn-outline-warning me-1" onClick={() => onRate(m.id, star)}>{star} ⭐</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
