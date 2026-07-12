import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Kayıt ol · Jukebox",
};

export default function RegisterPage() {
  return (
    <AuthShell subtitle="Mekan paneli" title="Kayıt ol">
      <RegisterForm />
    </AuthShell>
  );
}
