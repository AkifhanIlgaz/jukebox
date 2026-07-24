"use client";

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  EmptyState,
  FieldError,
  Form,
  Input,
  Label,
  Pagination,
  Table,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ListMusic } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { youtubeApi } from "@/features/admin/api/youtube-api";
import { PlaylistTableRow } from "@/features/admin/components/PlaylistTableRow";
import { extractYouTubeId } from "@/features/admin/lib/youtube";
import { addSongSchema, type AddSongFormValues } from "@/features/admin/schemas/add-song-schema";

type PlaylistSong = { key: string; videoId: string };

const ROWS_PER_PAGE = 10;

export default function AdminPlaylistPage() {
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [page, setPage] = useState(1);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<AddSongFormValues>({
    resolver: zodResolver(addSongSchema),
    defaultValues: { youtubeUrl: "" },
  });

  const addSongMutation = useMutation({
    mutationFn: async (videoId: string) => youtubeApi.fetchVideoInfo(videoId),
  });

  const totalPages = Math.max(1, Math.ceil(songs.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedSongs = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return songs.slice(start, start + ROWS_PER_PAGE);
  }, [songs, currentPage]);

  const rangeStart = songs.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * ROWS_PER_PAGE, songs.length);

  function onSubmit(values: AddSongFormValues) {
    const videoId = extractYouTubeId(values.youtubeUrl);
    if (!videoId) return;

    if (songs.some((song) => song.videoId === videoId)) {
      setError("youtubeUrl", { message: "Bu şarkı zaten playlistte" });
      return;
    }

    addSongMutation.mutate(videoId, {
      onSuccess: () => {
        setSongs((current) => [...current, { key: crypto.randomUUID(), videoId }]);
        reset();
      },
      onError: () => {
        setError("youtubeUrl", { message: "Video bilgisi alınamadı, linki kontrol et" });
      },
    });
  }

  function handleRemoveSong(key: string) {
    setSongs((current) => current.filter((song) => song.key !== key));
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4 ">
      <Card className="p-0" variant="transparent">
        <CardHeader className="font-semibold">
            Şarkı ekle
        </CardHeader>
        <Form
          className="flex flex-col gap-1.5"
          validationBehavior="aria"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name="youtubeUrl"
              render={({ field }) => (
                <TextField
                  className="flex-1"
                  isInvalid={!!errors.youtubeUrl}
                  isRequired
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Label className="sr-only">YouTube linki</Label>
                  <Input placeholder="YouTube linki (ör. https://www.youtube.com/watch?v=dQw4w9WgXcQ)" />
                  <FieldError>{errors.youtubeUrl?.message}</FieldError>
                </TextField>
              )}
            />
            <Button isDisabled={addSongMutation.isPending} type="submit" variant="primary">
              {addSongMutation.isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </Form>
      </Card>

      <Card className="px-5.5 py-5">
        <div className="mb-3.5 text-base font-semibold">Playlist ({songs.length})</div>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Playlist" className="min-w-150">
              <Table.Header>
                <Table.Column isRowHeader>Şarkı</Table.Column>
                <Table.Column>Kanal</Table.Column>
                <Table.Column>Video ID</Table.Column>
                <Table.Column className="text-end">Aksiyonlar</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-2 py-8 text-center">
                    <ListMusic className="size-8 text-muted" />
                    <span className="text-sm font-medium">Playlist boş</span>
                    <span className="text-xs text-muted">
                      Yukarıdan bir YouTube linki ekleyerek başlayabilirsin.
                    </span>
                  </EmptyState>
                )}
              >
                {paginatedSongs.map((song) => (
                  <PlaylistTableRow
                    key={song.key}
                    youtubeId={song.videoId}
                    onRemove={() => handleRemoveSong(song.key)}
                  />
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {songs.length > 0 && (
            <Table.Footer>
              <Pagination size="sm">
                <Pagination.Summary>
                  {rangeStart}-{rangeEnd} / {songs.length}
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={currentPage === 1}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <Pagination.PreviousIcon />
                      Önceki
                    </Pagination.Previous>
                  </Pagination.Item>
                  {pages.map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link isActive={p === currentPage} onPress={() => setPage(p)}>
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={currentPage === totalPages}
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sonraki
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </Table.Footer>
          )}
        </Table>
      </Card>
    </div>
  );
}
