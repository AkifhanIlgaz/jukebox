import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunlu"),
  password: z.string().min(1, "Şifre zorunlu"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
