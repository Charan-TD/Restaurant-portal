"use client";
import { Box, Link, Typography } from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import { tokens } from "@/core/theme/tokens";
import type {
  ProfileChangeRequest,
  RestaurantDetails,
} from "../services/restaurantApi";
import { ChangeRequestForm, ChangeRequestHistory } from "./ChangeRequestCard";
import { PaneHeading } from "./PaneHeading";
import { SubHeading } from "./PaneParts";

function DocRow({
  title,
  detail,
  url,
}: {
  title: string;
  detail?: string;
  url?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.5,
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          borderRadius: "10px",
          color: tokens.color.textMuted,
          bgcolor: tokens.color.muted,
        }}
      >
        <DescriptionOutlined fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {detail || (url ? "On file" : "Not added")}
        </Typography>
      </Box>
      {url && (
        <Link
          href={url}
          target="_blank"
          rel="noreferrer"
          underline="none"
          sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.link }}
        >
          View
        </Link>
      )}
    </Box>
  );
}

/** The documents on record, and a form to ask for changes. */
export function DocumentsPane({
  details,
  requests,
  onSent,
}: {
  details?: RestaurantDetails | null;
  requests: ProfileChangeRequest[];
  onSent: () => void;
}) {
  return (
    <>
      <PaneHeading
        title="Business documents"
        subtitle="Keep these valid to stay listed on TrainDhaba"
      />
      <Box sx={{ p: 3, display: "grid", gap: 3.5 }}>
        <Box>
          <SubHeading>FSSAI licence</SubHeading>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.input,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: tokens.color.textMuted,
              }}
            >
              Licence number
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {details?.fssai || "Not added"}
            </Typography>
          </Box>
        </Box>
        <Box>
          <SubHeading>Other documents</SubHeading>
          <Box sx={{ mt: -1 }}>
            <DocRow title="PAN card" url={details?.documents.pan} />
            <DocRow
              title="GST certificate"
              detail={details?.gstin}
              url={details?.documents.gst}
            />
            <DocRow title="Identity proof" url={details?.documents.aadhaar} />
          </Box>
        </Box>
        <Box>
          <SubHeading note="Changes wait for admin approval and stay unchanged until approved.">
            Request a change
          </SubHeading>
          <ChangeRequestForm onSent={onSent} details={details} />
        </Box>
        {requests.length > 0 && <ChangeRequestHistory requests={requests} />}
      </Box>
    </>
  );
}
