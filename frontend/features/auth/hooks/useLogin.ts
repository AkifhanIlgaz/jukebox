import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/api/auth-api";
import type { LoginFormValues } from "@/features/auth/schemas/login-schema";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }
  return "Giriş yapılamadı. Lütfen tekrar deneyin.";
}

export function useLogin() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: () => {
      router.push("/admin");
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error ? extractErrorMessage(mutation.error) : null,
  };
}
