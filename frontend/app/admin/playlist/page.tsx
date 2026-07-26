import { AddSongForm } from "@/features/playlist/components/AddSongForm";
import { PlaylistTable } from "@/features/playlist/components/PlaylistTable";

export default function AdminPlaylistPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <AddSongForm />
      <PlaylistTable />
    </div>
  );
}
