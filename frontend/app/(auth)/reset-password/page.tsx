import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Şifreyi sıfırla · Jukebox",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell subtitle="Şifreyi sıfırla" title="Şifreyi sıfırla">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
