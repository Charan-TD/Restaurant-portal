"use client";
import { useState } from "react";
import { Box, Button, Popover, Typography } from "@mui/material";
import CallOutlined from "@mui/icons-material/CallOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import { tokens } from "@/core/theme/tokens";

/** The outlined Help button at the right of the header; it opens a short note on getting help. */
export function HelpButton() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<HelpOutlineOutlined sx={{ fontSize: 18 }} />}
        aria-haspopup="dialog"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          minHeight: 40,
          px: 2,
          borderRadius: "10px",
          fontSize: 14,
          fontWeight: 600,
          color: tokens.color.text,
          borderColor: tokens.color.borderInput,
          "&:hover": { borderColor: tokens.color.borderInput, bgcolor: tokens.color.muted },
        }}
      >
        Help
      </Button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { mt: 1, p: 0.5, width: 290, borderRadius: "14px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)" },
          },
        }}
      >
        {[
          {
            title: "Call us",
            value: "1800 123 4567",
            href: "tel:18001234567",
            icon: <CallOutlined sx={{ fontSize: 20 }} />,
            fg: tokens.color.success,
            bg: tokens.color.successBg,
          },
          {
            title: "Email us",
            value: "partners@traindhaba.com",
            href: "mailto:partners@traindhaba.com?subject=TrainDhaba%20Partner%20support",
            link: true,
            icon: <MailOutlined sx={{ fontSize: 20 }} />,
            fg: tokens.color.info,
            bg: tokens.color.infoBg,
          },
        ].map((row) => (
          <Box
            key={row.title}
            component="a"
            href={row.href}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1.5,
              color: "inherit",
              textDecoration: "none",
              borderRadius: "10px",
              "& + &": { borderTop: `1px solid ${tokens.color.borderSubtle}`, borderRadius: "0 0 10px 10px" },
              "&:hover": { bgcolor: tokens.color.sunken },
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                color: row.fg,
                bgcolor: row.bg,
              }}
            >
              {row.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>
                {row.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  lineHeight: "18px",
                  color: row.link ? tokens.color.text : tokens.color.textMuted,
                  textDecoration: row.link ? "underline" : "none",
                }}
              >
                {row.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Popover>
    </>
  );
}
