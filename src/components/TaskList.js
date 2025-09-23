import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";

export default function TaskList({
  memos,
  onStatusChange,
  onRate,
  showStaff = false,
}) {
  return (
    <Stack spacing={2}>
      {memos.map((m) => (
        <Card key={m.id} variant="outlined" sx={{ p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {m.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {m.description}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip label={`Priority: ${m.priority}`} color="primary" size="small" />
              <Chip label={`Skill: ${m.skillType}`} color="info" size="small" />
            </Stack>

            <Typography variant="body2" sx={{ mb: 1 }}>
              Status: {m.status} | Deadline: {m.deadline}
            </Typography>

            {showStaff && m.staffAssigned && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Staff Assigned: {m.staffAssigned.map((s) => s.name).join(", ")}
              </Typography>
            )}

            {onStatusChange && (
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {m.status === "Pending" && (
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    onClick={() => onStatusChange(m.id, "In Progress")}
                  >
                    Start
                  </Button>
                )}
                {m.status === "In Progress" && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => onStatusChange(m.id, "Completed")}
                  >
                    Complete
                  </Button>
                )}
              </Stack>
            )}

            {onRate && (
              <Stack direction="row" spacing={1}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => onRate(m.id, star)}
                  >
                    {star} ⭐
                  </Button>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
