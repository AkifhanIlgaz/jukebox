import { z } from "zod";

export const createAdminSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunlu"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export type CreateAdminFormValues = z.infer<typeof createAdminSchema>;
