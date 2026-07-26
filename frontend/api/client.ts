import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const GENERIC_ERROR_MESSAGE = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return GENERIC_ERROR_MESSAGE;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post<{ accessToken: string }>(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    null,
    { withCredentials: true },
  );
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }
    config._retried = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      setAccessToken(token);
      config.headers.Authorization = `Bearer ${token}`;
      return apiClient(config);
    } catch (refreshError) {
      setAccessToken(null);
      return Promise.reject(refreshError);
    }
  },
);
