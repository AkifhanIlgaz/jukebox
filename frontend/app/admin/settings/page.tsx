"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { VenueSettingsForm } from "@/features/admin/components/VenueSettingsForm";
import { VenueUsersTable } from "@/features/admin/components/VenueUsersTable";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && currentUser?.role !== "boss") {
      router.replace("/admin");
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || currentUser?.role !== "boss") {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <PageHeader title="Ayarlar" description="Mekan bilgilerini ve oylama ayarlarını buradan güncelle." />
      <VenueSettingsForm />
      <VenueUsersTable />
    </div>
  );
}
