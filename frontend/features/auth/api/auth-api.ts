import { z } from "zod";
import { BaseApi } from "@/api/base-api";
import type { LoginFormValues } from "@/features/auth/schemas/login-schema";

const loginResponseSchema = z.object({
  message: z.string(),
});

class AuthApi extends BaseApi {
  async login(values: LoginFormValues) {
    return this.post( "/login", loginResponseSchema, values);
  }
}

export const authApi = new AuthApi();
