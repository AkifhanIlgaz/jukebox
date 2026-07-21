import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş yap · Jukebox",
};

export default function LoginPage() {
  return (
    <AuthShell subtitle="Mekan paneli" title="Giriş yap">
      <LoginForm />
    </AuthShell>
  );
}
