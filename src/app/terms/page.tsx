import type { Metadata } from "next";
import { LegalView } from "@/features/legal/views/LegalView";
import { termsContent } from "@/features/legal/models/termsContent";

export const metadata: Metadata = {
  title: "Partner terms · TrainDhaba",
};

export default function Page() {
  return <LegalView document={termsContent} />;
}
