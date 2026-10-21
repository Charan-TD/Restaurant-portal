import { Box, Pagination, Typography } from "@mui/material";

export const PAGE_SIZE = 5;

/** "Showing 1–5 of 12 customers" with page buttons. */
export function ListFooter({
  page,
  total,
  noun,
  onPage,
}: {
  page: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to = Math.min(page * PAGE_SIZE, total);
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mt: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {from}–{to} of {total} {noun}
      </Typography>
      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          count={Math.ceil(total / PAGE_SIZE)}
          onChange={(_, value) => onPage(value)}
          color="primary"
          variant="outlined"
          shape="rounded"
        />
      )}
    </Box>
  );
}
