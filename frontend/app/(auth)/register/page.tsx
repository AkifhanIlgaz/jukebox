import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

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
