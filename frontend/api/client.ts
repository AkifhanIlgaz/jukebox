import axios, { type AxiosError, type RawAxiosResponseHeaders, type AxiosResponseHeaders } from "axios";

const GENERIC_ERROR_MESSAGE = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";

// Access token'ı taşıyan response header'ı — backend, access token süresi
// dolmuşsa refresh_token çerezini (her istekte otomatik gider) okuyup
// şeffafça yeniler ve yenisini buradan döner. Ayrı bir /refresh isteği YOK
// (bkz. docs/decisions.md, karar 2026-07-28).
const ACCESS_TOKEN_HEADER = "x-access-token";

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

export function getAccessToken() {
  return accessToken;
}

// getWsUrl, NEXT_PUBLIC_API_URL'i (http/https) ws/wss şemasına çevirip WS
// endpoint'inin tam URL'ini üretir (bkz. backend/internal/ws).
export function getWsUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}`.replace(/^http/, "ws") + path;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

function captureRefreshedAccessToken(headers?: RawAxiosResponseHeaders | AxiosResponseHeaders) {
  const refreshed = headers?.[ACCESS_TOKEN_HEADER];
  if (typeof refreshed === "string" && refreshed.length > 0) {
    setAccessToken(refreshed);
  }
}

apiClient.interceptors.response.use(
  (response) => {
    captureRefreshedAccessToken(response.headers);
    return response;
  },
  (error: AxiosError) => {
    captureRefreshedAccessToken(error.response?.headers);
    return Promise.reject(error);
  },
);
