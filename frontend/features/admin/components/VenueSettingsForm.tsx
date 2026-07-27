"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  NumberField,
  Spinner,
  TextField,
  Tooltip,
} from "@heroui/react";
import { CircleHelp } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { useUpdateVenue } from "@/features/admin/hooks/useUpdateVenue";
import { useVenue } from "@/features/admin/hooks/useVenue";
import {
  venueSettingsFormSchema,
  type VenueSettingsFormValues,
} from "@/features/admin/schemas/venue-settings-schema";

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label="Açıklama">
        <CircleHelp className="size-3.5 text-muted" />
      </Tooltip.Trigger>
      <Tooltip.Content showArrow className="max-w-64">
        <Tooltip.Arrow />
        <p className="text-xs">{children}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

function FieldLabel({ hint, children }: { hint: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{children}</Label>
      <FieldHint>{hint}</FieldHint>
    </div>
  );
}

export function VenueSettingsForm() {
  const { data: venue, isLoading } = useVenue();
  const updateVenueMutation = useUpdateVenue();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VenueSettingsFormValues>({
    resolver: zodResolver(venueSettingsFormSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      roundIntervalMin: 2,
      candidateCount: 5,
      recentlyPlayedCooldownMin: 20,
      candidateCooldownMin: 30,
    },
  });

  useEffect(() => {
    if (!venue) return;

    reset({
      name: venue.name,
      logoUrl: venue.logoUrl,
      roundIntervalMin: venue.settings.roundIntervalMin,
      candidateCount: venue.settings.candidateCount,
      recentlyPlayedCooldownMin: venue.settings.recentlyPlayedCooldownMin,
      candidateCooldownMin: venue.settings.candidateCooldownMin,
    });
  }, [venue, reset]);

  const onSubmit = (values: VenueSettingsFormValues) => {
    updateVenueMutation.mutate({
      name: values.name,
      logoUrl: values.logoUrl,
      settings: {
        roundIntervalMin: values.roundIntervalMin,
        candidateCount: values.candidateCount,
        recentlyPlayedCooldownMin: values.recentlyPlayedCooldownMin,
        candidateCooldownMin: values.candidateCooldownMin,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="flex w-full flex-col items-center justify-center gap-2 px-5.5 py-8 text-center">
        <Spinner size="md" />
        <div className="text-sm font-medium">Mekan bilgileri yükleniyor...</div>
      </Card>
    );
  }

  return (
    <Form className="flex w-full flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Card className="flex w-full flex-col gap-4 px-5.5 py-5">
        <div className="text-base font-semibold">Mekan bilgileri</div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                isRequired
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                isInvalid={!!errors.name}
              >
                <Label>Mekan adı</Label>
                <Input placeholder="Kahve Durağı" />
                <FieldError>{errors.name?.message}</FieldError>
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <TextField
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                isInvalid={!!errors.logoUrl}
              >
                <Label>Logo URL</Label>
                <Input placeholder="https://..." />
                <FieldError>{errors.logoUrl?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        {venue ? (
          <div className="text-xs text-muted">
            Slug: <span className="font-medium text-foreground">{venue.slug}</span>
          </div>
        ) : null}
      </Card>

      <Card className="flex w-full flex-col gap-4 px-5.5 py-5">
        <div className="text-base font-semibold">Oylama ayarları</div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Controller
            control={control}
            name="roundIntervalMin"
            render={({ field }) => (
              <NumberField
                isRequired
                minValue={1}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(value) => field.onChange(value ?? 0)}
                isInvalid={!!errors.roundIntervalMin}
              >
                <FieldLabel hint="Yeni bir oylama turu açıldıktan sonra oy toplama süresi. Süre dolunca en çok oy alan şarkı kuyruğa eklenir.">
                  Tur süresi (dk)
                </FieldLabel>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <FieldError>{errors.roundIntervalMin?.message}</FieldError>
              </NumberField>
            )}
          />

          <Controller
            control={control}
            name="candidateCount"
            render={({ field }) => (
              <NumberField
                isRequired
                minValue={1}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(value) => field.onChange(value ?? 0)}
                isInvalid={!!errors.candidateCount}
              >
                <FieldLabel hint="Her turda playlistten rastgele seçilip müşterilere oylatılacak şarkı sayısı.">
                  Tur başına aday sayısı
                </FieldLabel>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <FieldError>{errors.candidateCount?.message}</FieldError>
              </NumberField>
            )}
          />

          <Controller
            control={control}
            name="recentlyPlayedCooldownMin"
            render={({ field }) => (
              <NumberField
                isRequired
                minValue={1}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(value) => field.onChange(value ?? 0)}
                isInvalid={!!errors.recentlyPlayedCooldownMin}
              >
                <FieldLabel hint="Bir şarkı çaldıktan sonra tekrar aday veya fallback olarak seçilebilmesi için beklenmesi gereken süre.">
                  Yeniden çalma bekleme süresi (dk)
                </FieldLabel>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <FieldError>{errors.recentlyPlayedCooldownMin?.message}</FieldError>
              </NumberField>
            )}
          />

          <Controller
            control={control}
            name="candidateCooldownMin"
            render={({ field }) => (
              <NumberField
                isRequired
                minValue={1}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(value) => field.onChange(value ?? 0)}
                isInvalid={!!errors.candidateCooldownMin}
              >
                <FieldLabel hint="Bir şarkı çalmadan aday gösterilse bile, art arda turlarda tekrar aday olabilmesi için beklenmesi gereken süre.">
                  Yeniden aday olma bekleme süresi (dk)
                </FieldLabel>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <FieldError>{errors.candidateCooldownMin?.message}</FieldError>
              </NumberField>
            )}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button isPending={updateVenueMutation.isPending} type="submit" variant="primary">
          {({ isPending: isButtonPending }) => (
            <>
              {isButtonPending ? <Spinner color="current" size="sm" /> : null}
              Kaydet
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}
