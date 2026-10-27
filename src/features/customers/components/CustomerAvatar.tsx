import { Avatar } from "@mui/material";

const tints = [
  { bg: "#fdeee6", fg: "#e8590c" },
  { bg: "#e7f0fd", fg: "#1c64d6" },
  { bg: "#e6f6ec", fg: "#1f8a4c" },
  { bg: "#f0e9fb", fg: "#7c3aed" },
  { bg: "#fde8e8", fg: "#d62828" },
];

/** The customer's first letter on a soft colour picked from their name. */
export function CustomerAvatar({
  name,
  photo,
}: {
  name: string;
  photo?: string;
}) {
  const tint =
    tints[
      [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % tints.length
    ];
  return (
    <Avatar
      src={photo}
      alt={name}
      sx={{
        width: 52,
        height: 52,
        bgcolor: tint.bg,
        color: tint.fg,
        fontWeight: 600,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}
