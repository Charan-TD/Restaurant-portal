import type { Metadata } from "next";
import { LegalView } from "@/features/legal/views/LegalView";
import { privacyContent } from "@/features/legal/models/privacyContent";

export const metadata: Metadata = {
  title: "Privacy policy · TrainDhaba",
};

export default function Page() {
  return <LegalView document={privacyContent} />;
}
