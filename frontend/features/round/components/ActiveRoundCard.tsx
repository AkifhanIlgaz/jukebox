"use client";

import { AlertDialog, Button, Card, Spinner } from "@heroui/react";
import { SquareX, Vote } from "lucide-react";

import { CandidateList } from "@/features/round/components/CandidateList";
import { Countdown } from "@/features/round/components/Countdown";
import { useActiveRound } from "@/features/round/hooks/useActiveRound";
import { useCloseRound } from "@/features/round/hooks/useCloseRound";
import { useCountdown } from "@/features/round/hooks/useCountdown";
import { useStartRound } from "@/features/round/hooks/useStartRound";

export function ActiveRoundCard() {
  const { data: round, isLoading } = useActiveRound();
  const startRoundMutation = useStartRound();
  const closeRoundMutation = useCloseRound();
  const remainingMs = useCountdown(round?.endsAt);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 px-5.5 py-8 text-center">
        <Spinner size="md" />
        <div className="text-sm font-medium">Oylama durumu yükleniyor...</div>
      </Card>
    );
  }

  if (!round) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 px-5.5 py-8 text-center">
        <Vote className="size-8 text-muted" />
        <div className="text-sm font-medium">Aktif oylama yok</div>
        <div className="text-xs text-muted">Müşterilerin oy verebilmesi için yeni bir tur başlat.</div>
        <Button
          className="mt-2"
          variant="primary"
          isDisabled={startRoundMutation.isPending}
          onPress={() => startRoundMutation.mutate()}
        >
          {startRoundMutation.isPending ? "Başlatılıyor..." : "Oylama başlat"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="px-5.5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Aktif Oylama</div>
          <div className="text-xs text-muted">{round.candidates.length} aday şarkı</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-surface-tertiary px-3 py-1 text-sm font-bold tabular-nums">
            {remainingMs <= 0 ? "Bitiyor..." : <Countdown remainingMs={remainingMs} />}
          </div>
          <AlertDialog>
            <Button
              variant="danger-soft"
              size="sm"
              isIconOnly
              aria-label="Oylamayı kapat"
              isDisabled={closeRoundMutation.isPending}
            >
              <SquareX className="size-4" />
            </Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[400px]">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>Oylamayı kapat?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p>
                      Aktif oylama turu kazanan seçilmeden kapatılacak ve oylar silinecek. Yeni bir
                      tur açmak için tekrar &quot;Oylama başlat&quot; demen gerekecek.
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Vazgeç
                    </Button>
                    <Button slot="close" variant="danger" onPress={() => closeRoundMutation.mutate()}>
                      Kapat
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </div>
      <Card.Content className="mt-3.5">
        <CandidateList candidates={round.candidates} isVotable={false} />
      </Card.Content>
    </Card>
  );
}
