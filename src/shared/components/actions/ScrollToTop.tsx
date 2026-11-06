"use client";
import { useEffect, useState } from "react";
import { Fade, IconButton } from "@mui/material";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import { tokens } from "@/core/theme/tokens";

/** A plain arrow in the corner, in the primary colour, that appears once the page is scrolled down and takes you back to the top. */
export function ScrollToTop({ after = 400 }: { after?: number }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > after);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [after]);
  return (
    <Fade in={shown}>
      <IconButton
        aria-label="Scroll back to the top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          })
        }
        sx={{
          position: "fixed",
          right: { xs: 12, md: 28 },
          bottom: { xs: 12, md: 28 },
          p: 0.5,
          color: tokens.color.primary,
          "&:hover": { bgcolor: "transparent", color: tokens.color.primaryHover },
        }}
      >
        <ArrowUpwardRounded sx={{ fontSize: 32 }} />
      </IconButton>
    </Fade>
  );
}
