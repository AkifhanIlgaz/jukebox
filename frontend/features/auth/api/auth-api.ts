import { z } from "zod";
import { BaseApi } from "@/api/base-api";
import type { LoginFormValues } from "@/features/auth/schemas/login-schema";

const messageResponseSchema = z.object({
  message: z.string(),
});

const loginResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
});

class AuthApi extends BaseApi {
  async login(values: LoginFormValues) {
    return this.post("/login", loginResponseSchema, values);
  }

  async logout() {
    return this.post("/logout", messageResponseSchema);
  }
}

export const authApi = new AuthApi();
