import { Suspense } from "react";
import { ResetPasswordView } from "@/features/auth/views/ResetPasswordView";
export default function Page() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
