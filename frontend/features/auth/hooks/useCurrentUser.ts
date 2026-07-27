"use client";

import { useEffect, useState } from "react";

const ROLES = ["admin", "boss"] as const;
export type Role = (typeof ROLES)[number];

type CurrentUser = {
  role: Role;
  username: string;
};

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

// Backend login/logout'ta auth_token ile birlikte httpOnly OLMAYAN `role` ve
// `username` cookie'lerini set/temizler (bkz. backend/internal/auth/auth_handler.go) —
// bu hook onları okur. Ağ isteği yok; rol zaten bir yetki sınırı değil, sadece
// UI gösterme/gizleme kararı (asıl yetki backend'de RequireRole ile korunuyor).
export function useCurrentUser() {
  const [data, setData] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = readCookie("role");
    const username = readCookie("username");

    if (role && username && (ROLES as readonly string[]).includes(role)) {
      setData({ role: role as Role, username: decodeURIComponent(username) });
    } else {
      setData(null);
    }

    setIsLoading(false);
  }, []);

  return { data, isLoading };
}
