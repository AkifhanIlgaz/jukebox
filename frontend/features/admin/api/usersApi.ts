import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const venueUserSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  username: z.string(),
  role: z.enum(["admin", "boss"]),
  createdAt: z.coerce.date(),
});

export type VenueUser = z.infer<typeof venueUserSchema>;

export type CreateAdminInput = {
  username: string;
  password: string;
};

class UsersApi extends BaseApi {
  async listUsers() {
    return this.get("/users", z.array(venueUserSchema));
  }

  async createAdmin(input: CreateAdminInput) {
    return this.post("/users", venueUserSchema, input);
  }

  async deleteAdmin(id: string) {
    return this.delete(`/users/${id}`, z.object({ message: z.string() }));
  }
}

export const usersApi = new UsersApi();
