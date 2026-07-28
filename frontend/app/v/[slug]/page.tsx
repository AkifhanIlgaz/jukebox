"use client";

import { Skeleton, Tabs } from "@heroui/react";
import { ListMusic, Music2, Vote } from "lucide-react";
import { use } from "react";

import { ThemeToggleIconButton } from "@/components/ui/ThemeToggleIconButton";
import { NowPlayingSection } from "@/features/venue-public/components/NowPlayingSection";
import { QueueSection } from "@/features/venue-public/components/QueueSection";
import { RoundVotingPanel } from "@/features/venue-public/components/RoundVotingPanel";
import { useActiveRoundPublic } from "@/features/venue-public/hooks/useActiveRoundPublic";
import { useNowPlayingSocket } from "@/features/venue-public/hooks/useNowPlayingSocket";
import { useQueuePublic } from "@/features/venue-public/hooks/useQueuePublic";
import { useVenuePublic } from "@/features/venue-public/hooks/useVenuePublic";

export default function VenuePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const venue = useVenuePublic(slug);
  const queue = useQueuePublic(slug);
  const round = useActiveRoundPublic(slug);
  const nowPlaying = useNowPlayingSocket(slug, venue.data?.nowPlaying ?? "");

  if (venue.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
        <div className="flex justify-end">
          <ThemeToggleIconButton />
        </div>
        <Skeleton className="mx-auto aspect-square w-1/2 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (venue.isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
        <div className="flex justify-end">
          <ThemeToggleIconButton />
        </div>
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <Music2 className="size-8 text-muted" />
          <div className="text-sm font-medium">Mekan bulunamadı</div>
          <div className="text-xs text-muted">Bağlantıyı kontrol et veya QR kodu tekrar okut.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
        <div />
        <div className="truncate text-center text-xl font-semibold">{venue.data.name}</div>
        <div className="flex justify-end">
          <ThemeToggleIconButton />
        </div>
      </div>

      <NowPlayingSection youtubeId={nowPlaying} />

      <Tabs className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Mekan sekmeleri" className="w-full">
            <Tabs.Tab id="round" className="flex-1 justify-center gap-1.5">
              <Vote className="size-4" />
              Oylama
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="queue" className="flex-1 justify-center gap-1.5">
              <ListMusic className="size-4" />
              Sıra
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="round" className="pt-4">
          <RoundVotingPanel round={round.data} isPending={round.isPending} />
        </Tabs.Panel>

        <Tabs.Panel id="queue" className="pt-4">
          <QueueSection tracks={queue.data?.tracks} isPending={queue.isPending} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
