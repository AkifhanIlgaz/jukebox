"use client";

import type { Key } from "@heroui/react";
import { Card, EmptyState, Label, ListBox, Pagination, Select, Table } from "@heroui/react";
import { ListMusic } from "lucide-react";
import { useState } from "react";

import { PlaylistTableRow } from "@/features/playlist/components/PlaylistTableRow";
import { useDeleteTrack } from "@/features/playlist/hooks/useDeleteTrack";
import { useTracks } from "@/features/playlist/hooks/useTracks";
import { useAddToQueue } from "@/features/queue/hooks/useAddToQueue";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;

export function PlaylistTable() {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[2]);
  const tracksQuery = useTracks({ page, limit: rowsPerPage });
  const deleteTrackMutation = useDeleteTrack();
  const addToQueueMutation = useAddToQueue();

  const tracks = tracksQuery.data?.tracks ?? [];
  const total = tracksQuery.data?.total ?? 0;
  const totalPages = tracksQuery.data?.totalPages ?? 1;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(page * rowsPerPage, total);

  function onRowsPerPageChange(value: Key | null) {
    if (value == null) return;
    setRowsPerPage(Number(value));
    setPage(1);
  }

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-base font-semibold">Playlist ({total})</div>
        <Select className="flex-row items-center gap-2" value={rowsPerPage} onChange={onRowsPerPageChange}>
          <Label className="text-xs text-muted">Sayfa başına</Label>
          <Select.Trigger className="w-30">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <ListBox.Item key={option} id={option} textValue={`${option}`}>
                  {option} şarkı
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Playlist" className="min-w-150">
            <Table.Header>
              <Table.Column isRowHeader>Şarkı</Table.Column>
              <Table.Column>Kanal</Table.Column>
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
              {tracks.map((track) => (
                <PlaylistTableRow
                  key={track.id}
                  channel={track.channel}
                  isDeleting={
                    deleteTrackMutation.isPending && deleteTrackMutation.variables?.id === track.id
                  }
                  title={track.title}
                  youtubeId={track.youtubeId}
                  onAddToQueue={() =>
                    addToQueueMutation.mutate({
                      youtubeUrl: `https://www.youtube.com/watch?v=${track.youtubeId}`,
                    })
                  }
                  onDelete={() => deleteTrackMutation.mutate({ id: track.id, title: track.title })}
                />
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        {total > 0 && (
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                {rangeStart}-{rangeEnd} / {total}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                    Önceki
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
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
  );
}
