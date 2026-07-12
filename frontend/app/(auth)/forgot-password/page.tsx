import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Şifremi unuttum · Jukebox",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell subtitle="Şifremi unuttum" title="Şifremi unuttum">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
