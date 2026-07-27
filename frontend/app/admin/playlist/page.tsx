import { PageHeader } from "@/components/ui/PageHeader";
import { PlaylistTable } from "@/features/playlist/components/PlaylistTable";

export default function AdminPlaylistPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <PageHeader
        title="Playlist"
        description="Mekanının şarkı havuzunu buradan yönet: yeni şarkı ekle, mevcutları kaldır ya da doğrudan kuyruğa gönder."
      />
      <PlaylistTable />
    </div>
  );
}
