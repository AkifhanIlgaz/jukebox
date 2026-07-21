"use client";

import { Alert, Button, Form, Spinner } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { NavLink } from "@/components/ui/NavLink";
import { PasswordField } from "./PasswordField";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
    }, 1000);
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Geçersiz bağlantı</Alert.Title>
            <Alert.Description>
              Bu şifre sıfırlama bağlantısının süresi dolmuş ya da geçersiz.
              Yeni bir bağlantı isteyebilirsin.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <NavLink href="/forgot-password">Yeni bağlantı iste</NavLink>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Şifre güncellendi</Alert.Title>
            <Alert.Description>
              Yeni şifrenle giriş yapabilirsin.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <NavLink className="text-center" href="/login">
          Girişe dön
        </NavLink>
      </div>
    );
  }

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted">Yeni şifreni belirle.</p>

      <PasswordField
        isRequired
        description="En az 8 karakter olmalı."
        label="Yeni şifre"
        minLength={8}
        name="password"
        onChange={setPassword}
        validate={(value) => {
          if (value.length < 8) {
            return "Şifre en az 8 karakter olmalı";
          }
          return null;
        }}
      />

      <PasswordField
        isRequired
        label="Yeni şifre (tekrar)"
        name="passwordConfirmation"
        validate={(value) => {
          if (value !== password) {
            return "Şifreler eşleşmiyor";
          }
          return null;
        }}
      />

      <Button isPending={isSubmitting} type="submit" variant="primary" className="w-full">
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            Şifreyi güncelle
          </>
        )}
      </Button>
    </Form>
  );
}
