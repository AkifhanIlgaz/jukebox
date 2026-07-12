"use client";

import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useState } from "react";
import { NavLink } from "@/components/ui/nav-link";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1000);
  };

  if (isSent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Bağlantı gönderildi</Alert.Title>
            <Alert.Description>
              E-posta adresine ulaştıysa şifre sıfırlama bağlantısını
              içeren bir mesaj gönderdik.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <NavLink href="/login">Girişe dön</NavLink>
      </div>
    );
  }

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted">
        Hesabına kayıtlı e-posta adresini gir, sana bir şifre sıfırlama
        bağlantısı gönderelim.
      </p>

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

      <Button isPending={isSubmitting} type="submit" variant="primary" className="w-full">
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            Sıfırlama bağlantısı gönder
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        <NavLink href="/login">Girişe dön</NavLink>
      </p>
    </Form>
  );
}
