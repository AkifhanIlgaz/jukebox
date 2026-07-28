import { useMutation } from "@tanstack/react-query";

import { setAccessToken } from "@/api/client";
import { authApi } from "@/features/auth/api/auth-api";

export function useLogout() {
  const mutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setAccessToken(null);
      // Client-side router.push kullanmıyoruz: buton bir Tooltip/overlay
      // içinde olduğu için React Aria'nın kapanış animasyonu/portal temizliği
      // ile route değişiminin aynı anda tüm ağacı unmount etmesi "removeChild"
      // hatasına yol açıyordu. Tam sayfa yenilemesi React'ın reconcile etmeye
      // çalışmasını tamamen ortadan kaldırıyor; react-query cache'i de
      // sayfa yenilenince zaten sıfırlanıyor.
      window.location.href = "/login";
    },
  });

  return {
    logout: mutation.mutate,
    isPending: mutation.isPending,
  };
}
