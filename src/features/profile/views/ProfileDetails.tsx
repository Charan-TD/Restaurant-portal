"use client";
import { Avatar, Box, Button, Typography } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import RoomServiceOutlined from "@mui/icons-material/RoomServiceOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import NextLink from "next/link";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { LocationMap } from "@/features/onboarding/components/LocationMap";
import type { RestaurantDetails } from "../services/restaurantService";
import type { VendorProfile } from "../viewmodels/useVendorProfile";
import { Field, FieldGrid, ProfileSection } from "./ProfileSection";
const noop = () => undefined;
/** "09:00" → "9:00 AM". */
function clock(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
/** "123456781234" → "XX XXXX 1234". */
const masked = (account?: string) =>
  account ? `XX XXXX ${account.slice(-4)}` : undefined;
interface Props {
  vendor: VendorProfile;
  details: RestaurantDetails | null;
  onEdit: () => void;
}
/** The read-only profile: header, basic information, location, hours and bank. */
export function ProfileDetails({ vendor, details, onEdit }: Props) {
  const place = details?.location,
    address = [place?.building, place?.landmark].filter(Boolean).join(", "),
    area = [place?.city, place?.state].filter(Boolean).join(", "),
    cityLine = [area, place?.pincode].filter(Boolean).join(" - "),
    name = details?.name || vendor.restaurantName,
    hasPin = place?.latitude != null && place?.longitude != null,
    bank = details?.bank,
    // Monday is first in the list; getDay() starts on Sunday.
    todayIndex = (new Date().getDay() + 6) % 7;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <CommonCard className="profile-card">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          <Avatar
            src={details?.logoUrl}
            variant="rounded"
            sx={{
              width: 80,
              height: 80,
              borderRadius: "16px",
              bgcolor: "primary.main",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            {vendor.initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {name || "Restaurant name not added"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.25 }}>
              {[details?.type, details?.cuisines.join(", ")]
                .filter(Boolean)
                .join(" · ") || `Owner · ${vendor.vendorName}`}
            </Typography>
            {(cityLine || vendor.city) && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.5,
                  color: "text.secondary",
                }}
              >
                <PlaceOutlined sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2">
                  {cityLine || vendor.city}
                </Typography>
              </Box>
            )}
          </Box>
          <CommonButton
            variant="outlined"
            startIcon={<EditOutlined />}
            onClick={onEdit}
          >
            Edit profile
          </CommonButton>
        </Box>
      </CommonCard>
      <ProfileSection
        icon={<StorefrontOutlined />}
        title="Basic information"
        subtitle="Key details about your restaurant"
      >
        <FieldGrid>
          <Field
            icon={<StorefrontOutlined />}
            label="Restaurant name"
            value={name}
          />
          <Field
            icon={<RestaurantOutlined />}
            label="Restaurant type"
            value={details?.type}
          />
          <Field
            icon={<PersonOutlineOutlined />}
            label="Owner name"
            value={details?.ownerName || (vendor.nameKnown ? vendor.vendorName : "")}
          />
          <Field
            icon={<RoomServiceOutlined />}
            label="Cuisines"
            value={details?.cuisines.join(", ")}
          />
          <Field
            icon={<PhoneOutlined />}
            label="Mobile number"
            value={details?.mobile || vendor.mobile}
          />
          <Field
            icon={<PhoneOutlined />}
            label="Restaurant contact (customers)"
            value={details?.contact}
          />
          <Field
            icon={<EmailOutlined />}
            label="Email"
            value={details?.email || vendor.email}
          />
          <Field
            icon={<DescriptionOutlined />}
            label="FSSAI number"
            value={details?.fssai}
          />
        </FieldGrid>
      </ProfileSection>
      <ProfileSection
        icon={<PlaceOutlined />}
        title="Location"
        subtitle="Your restaurant address and location on map"
      >
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "center",
            gridTemplateColumns: {
              xs: "1fr",
              md: hasPin ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
            },
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(242,106,46,.08)",
                flexShrink: 0,
              }}
            >
              <PlaceOutlined color="primary" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Address
              </Typography>
              {address || cityLine ? (
                <>
                  {address && (
                    <Typography sx={{ fontWeight: 600 }}>{address}</Typography>
                  )}
                  {cityLine && (
                    <Typography sx={{ fontWeight: 600 }}>{cityLine}</Typography>
                  )}
                </>
              ) : (
                <Typography color="text.disabled">Not added</Typography>
              )}
              {hasPin && (
                <Button
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps?q=${place!.latitude},${place!.longitude}`}
                  variant="outlined"
                  startIcon={<OpenInNewOutlined />}
                  sx={{ mt: 2 }}
                >
                  Open in Google Maps
                </Button>
              )}
            </Box>
          </Box>
          {hasPin && (
            <Box sx={{ pointerEvents: "none" }}>
              <LocationMap
                readOnly
                height={190}
                latitude={place!.latitude!}
                longitude={place!.longitude!}
                onMove={noop}
              />
            </Box>
          )}
        </Box>
      </ProfileSection>
      <ProfileSection
        icon={<ScheduleOutlined />}
        title="Operating hours"
        subtitle="Your restaurant working hours"
        action={
          <Button
            component={NextLink}
            href="/settings/working-hours"
            variant="outlined"
            startIcon={<ScheduleOutlined />}
          >
            Change hours
          </Button>
        }
      >
        {details ? (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(7, minmax(0, 1fr))",
              },
            }}
          >
            {details.hours.map((day, i) => (
              <Box
                key={day.day}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  textAlign: "center",
                  bgcolor:
                    i === todayIndex
                      ? "rgba(242,106,46,.16)"
                      : day.open
                        ? "rgba(242,106,46,.07)"
                        : "#f5f6f4",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {day.day.slice(0, 3)}
                </Typography>
                <Typography
                  variant="caption"
                  color={day.open ? "text.primary" : "text.disabled"}
                  sx={{ display: "block", lineHeight: 1.5, mt: 0.5 }}
                >
                  {day.open
                    ? `${clock(day.start)} - ${clock(day.end)}`
                    : "Closed"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.disabled">Not added</Typography>
        )}
      </ProfileSection>
      <ProfileSection
        icon={<AccountBalanceOutlined />}
        title="Bank details"
        subtitle="Your bank account information for payments"
      >
        <FieldGrid>
          <Field
            icon={<PersonOutlineOutlined />}
            label="Account holder name"
            value={bank?.holder}
          />
          <Field
            icon={<AccountBalanceOutlined />}
            label="Bank name"
            value={bank?.bank}
          />
          <Field
            icon={<CreditCardOutlined />}
            label="Account number"
            value={masked(bank?.account)}
          />
          <Field
            icon={<DescriptionOutlined />}
            label="IFSC code"
            value={bank?.ifsc}
          />
        </FieldGrid>
      </ProfileSection>
    </Box>
  );
}
