"use client";
import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Link, Typography } from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import { tokens } from "@/core/theme/tokens";
import { PortalHeader } from "@/shared/components/layout/PortalHeader";
import { ScrollToTop } from "@/shared/components/actions/ScrollToTop";
import type { LegalBlock, LegalDocument, LegalItem } from "../models/legal";

const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
  body = { margin: 0, fontSize: 15, lineHeight: "24px", color: "#1c1c1c", textAlign: "justify" } as const;

/** Email addresses in the text open a new message when clicked. */
function withLinks(text: string): ReactNode {
  return text.split(EMAIL).map((part, i) =>
    i % 2 ? (
      <Link key={i} href={`mailto:${part}`} sx={{ color: tokens.color.text, textDecorationColor: "currentcolor" }}>
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function Item({ item }: { item: LegalItem }) {
  if (typeof item === "string") return <li>{withLinks(item)}</li>;
  // A lead-in followed by a comma or colon stays attached to it.
  const glue = /^[,:;]/.test(item.text) ? "" : " ";
  return (
    <li>
      <b style={{ fontWeight: 600 }}>{item.lead}</b>
      {glue}
      {withLinks(item.text.replace(/^[,:;]\s*/, (m) => m.trimEnd() + " "))}
    </li>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string")
    return <Typography sx={body}>{withLinks(block)}</Typography>;
  return (
    <Box component="ul" sx={{ ...body, pl: "22px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {block.list.map((item, i) => (
        <Item key={i} item={item} />
      ))}
    </Box>
  );
}

/**
 * A page of legal text: the header, then the text running down the page in
 * numbered sections, with a plain arrow in the corner to get back to the top.
 */
export function LegalView({ document }: { document: LegalDocument }) {
  const { title, updated, intro, sections } = document;
  const router = useRouter();
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff", color: tokens.color.text }}>
      <PortalHeader />
      <Box>
        <Box
          component="nav"
          aria-label="Breadcrumb"
          sx={{ maxWidth: 1360, mx: "auto", boxSizing: "border-box", px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 2 }}
        >
          <ButtonBase
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/register"))}
            sx={{ gap: 1, fontSize: 22, lineHeight: "28px", fontWeight: 700, color: tokens.color.link }}
          >
            <ChevronLeftRounded sx={{ fontSize: 28 }} />
            Register
          </ButtonBase>
          <Typography component="span" aria-hidden sx={{ fontSize: 22, lineHeight: "28px", color: tokens.color.textMuted }}>
            /
          </Typography>
          <Typography component="span" aria-current="page" sx={{ fontSize: 22, lineHeight: "28px", color: tokens.color.textMuted }}>
            {title}
          </Typography>
        </Box>
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1360,
          mx: "auto",
          boxSizing: "border-box",
          px: 3,
          pt: 7,
          pb: 6,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          component="h1"
          sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
        >
          {title}
        </Typography>
        {updated && (
          <Typography sx={{ m: "0 0 4px", fontSize: 13, lineHeight: "18px", color: "#666" }}>{updated}</Typography>
        )}
        {intro && <Typography sx={{ ...body, mb: "28px" }}>{intro}</Typography>}
        {sections.map((section, i) => (
          <Box
            component="section"
            key={section.heading}
            aria-label={section.heading}
            sx={{ display: "flex", flexDirection: "column", gap: "12px", pb: "28px" }}
          >
            <Typography
              component="h2"
              sx={{ m: 0, fontSize: 16, lineHeight: "24px", fontWeight: 700, display: "flex", gap: "6px" }}
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
              {section.heading}
            </Typography>
            {section.body.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </Box>
        ))}
      </Box>
      <ScrollToTop after={300} />
    </Box>
  );
}
