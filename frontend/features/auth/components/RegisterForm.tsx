"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useState } from "react";
import { NavLink } from "@/components/ui/NavLink";
import { PasswordField } from "./PasswordField";

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField isRequired name="venueName">
        <Label>Mekan adı</Label>
        <Input placeholder="örn. Kafe Luma" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        name="email"
        type="email"
        validate={(value) => {
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
            return "Geçerli bir e-posta adresi girin";
          }
          return null;
        }}
      >
        <Label>E-posta</Label>
        <Input placeholder="siz@mekan.com" />
        <FieldError />
      </TextField>

      <PasswordField
        isRequired
        description="En az 8 karakter olmalı."
        label="Şifre"
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
        label="Şifre (tekrar)"
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
            Hesap oluştur
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        Zaten hesabın var mı? <NavLink href="/login">Giriş yap</NavLink>
      </p>
    </Form>
  );
}
