"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { NavLink } from "@/components/ui/NavLink";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login-schema";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
  const { login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  return (
    <Form className="flex flex-col gap-4 " onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <TextField
            isRequired
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
            isInvalid={!!errors.username}
          >
            <Label>Kullanıcı adı</Label>
            <Input placeholder="kullaniciadi" />
            <FieldError>{errors.username?.message}</FieldError>
          </TextField>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <PasswordField
            isRequired
            label="Şifre"
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
            errorMessage={errors.password?.message}
          />
        )}
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end text-xs">
        <NavLink href="/forgot-password">Şifreni mi unuttun?</NavLink>
      </div>

      <Button isPending={isPending} type="submit" variant="primary" className="w-full">
        {({ isPending: isButtonPending }) => (
          <>
            {isButtonPending ? <Spinner color="current" size="sm" /> : null}
            Giriş yap
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted">
        Hesabın yok mu? <NavLink href="/register">Kayıt ol</NavLink>
      </p>
    </Form>
  );
}
