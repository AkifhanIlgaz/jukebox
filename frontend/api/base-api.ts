import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { z } from "zod";
import { apiClient } from "./client";

export class BaseApi {
  protected readonly client: AxiosInstance = apiClient;

  protected async get<Schema extends z.ZodType>(
    url: string,
    schema: Schema,
    config?: AxiosRequestConfig,
  ): Promise<z.infer<Schema>> {
    const response = await this.client.get(url, config);
    return schema.parse(response.data);
  }

  protected async post<Schema extends z.ZodType, Input = unknown>(
    url: string,
    schema: Schema,
    body?: Input,
    config?: AxiosRequestConfig,
  ): Promise<z.infer<Schema>> {
    const response = await this.client.post(url, body, config);
    return schema.parse(response.data);
  }

  protected async put<Schema extends z.ZodType, Input = unknown>(
    url: string,
    schema: Schema,
    body?: Input,
    config?: AxiosRequestConfig,
  ): Promise<z.infer<Schema>> {
    const response = await this.client.put(url, body, config);
    return schema.parse(response.data);
  }

  protected async delete<Schema extends z.ZodType>(
    url: string,
    schema: Schema,
    config?: AxiosRequestConfig,
  ): Promise<z.infer<Schema>> {
    const response = await this.client.delete(url, config);
    return schema.parse(response.data);
  }
}
