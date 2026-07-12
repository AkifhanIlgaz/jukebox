import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

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
