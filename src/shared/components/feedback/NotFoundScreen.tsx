"use client";
import NextLink from "next/link";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";

const ORANGE = "#ee5b00",
  DEEP = "#d94f00",
  INK = "#1c1c1c",
  CREAM = "#fff8f1",
  HEAVY = "'Arial Black', 'Helvetica Neue', Impact, system-ui, sans-serif";

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={64} r={9} fill={INK} />
      <path
        d={`M${cx - 5} ${59}l10 10M${cx + 5} ${59}l-10 10`}
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

function Carriage({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={0} y={20} width={92} height={42} rx={8} fill={ORANGE} />
      {[10, 36, 62].map((wx) => (
        <rect key={wx} x={wx} y={28} width={20} height={14} rx={3} fill="#fff" />
      ))}
      <Wheel cx={20} />
      <Wheel cx={72} />
    </g>
  );
}

/** The train on its track, tilted off the rails to match the 404 message. */
function Train() {
  return (
    <svg
      viewBox="0 0 400 84"
      role="img"
      aria-label="A train off its track"
      style={{ width: "100%", maxWidth: 440, display: "block" }}
    >
      <Carriage x={0} />
      <Carriage x={100} />
      <g transform="translate(200 0)">
        <rect x={0} y={24} width={104} height={38} rx={8} fill={INK} />
        <rect x={64} y={6} width={40} height={30} rx={5} fill={INK} />
        <rect x={72} y={14} width={22} height={14} rx={3} fill="#ffb27a" />
        <rect x={14} y={8} width={14} height={18} fill={INK} />
        <rect x={8} y={4} width={26} height={6} rx={3} fill={INK} />
        <rect x={10} y={32} width={46} height={5} rx={2.5} fill={ORANGE} />
        <Wheel cx={22} />
        <Wheel cx={56} />
        <Wheel cx={90} />
      </g>
      <path d="M0 74h400" stroke={INK} strokeWidth={3} />
      {Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={i * 16 + 4} y={76} width={9} height={5} fill="#9a7a5c" />
      ))}
    </svg>
  );
}

/** The 404 screen: shown for any address the portal does not have. */
export function NotFoundScreen() {
  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 6,
        bgcolor: ORANGE,
      }}
    >
      <Typography
        aria-hidden
        sx={{
          position: "absolute",
          top: { xs: 24, md: 8 },
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: HEAVY,
          fontWeight: 900,
          fontSize: "clamp(120px, 26vw, 400px)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: DEEP,
          userSelect: "none",
        }}
      >
        OOPS!
      </Typography>
      <Box
        component="section"
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          mt: { xs: 12, md: 16 },
          px: { xs: 3, md: 6 },
          pt: { xs: 5, md: 6 },
          pb: 3,
          textAlign: "center",
          bgcolor: CREAM,
          borderRadius: "28px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          transform: "rotate(-2deg)",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontFamily: HEAVY,
            fontWeight: 900,
            fontSize: "clamp(32px, 7vw, 56px)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: INK,
          }}
        >
          WRONGTRACK!
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            fontFamily: HEAVY,
            fontWeight: 900,
            fontSize: "clamp(22px, 4.5vw, 36px)",
            color: ORANGE,
          }}
        >
          Page not found
        </Typography>
        <Typography sx={{ mt: 2, mx: "auto", maxWidth: 380, fontSize: 15, color: INK }}>
          We couldn&apos;t find this page. Check the address, or head back to
          your dashboard.
        </Typography>
        <Button
          component={NextLink}
          href="/"
          startIcon={<ArrowBackOutlined />}
          sx={{
            mt: 3,
            px: 3,
            minHeight: 48,
            borderRadius: 999,
            fontWeight: 700,
            color: "#fff",
            bgcolor: INK,
            "&:hover": { bgcolor: "#000" },
          }}
        >
          Back to home
        </Button>
        <Box sx={{ mt: 4, display: "grid", justifyItems: "center" }}>
          <Train />
        </Box>
      </Box>
      <Typography
        sx={{ position: "absolute", left: 24, bottom: 16, fontWeight: 600, color: "#fff", opacity: 0.9 }}
      >
        Error
      </Typography>
      <Typography
        sx={{ position: "absolute", right: 24, bottom: 16, fontWeight: 600, color: "#fff", opacity: 0.9 }}
      >
        404
      </Typography>
    </Box>
  );
}
