"use client";

import { Button, Card, CardHeader, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { getErrorMessage } from "@/api/client";
import { useAddTrack } from "@/features/playlist/hooks/useAddTrack";
import { addSongSchema, type AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";

export function AddSongForm() {
  const addSongMutation = useAddTrack();

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

  function onSubmit(values: AddSongFormValues) {
    addSongMutation.mutate(values, {
      onSuccess: () => reset(),
      onError: (error) => {
        setError("youtubeUrl", { message: getErrorMessage(error) });
      },
    });
  }

  return (
    <Card className="p-0" variant="transparent">
      <CardHeader className="font-semibold">Şarkı ekle</CardHeader>
      <Form className="flex flex-col gap-1.5" validationBehavior="aria" onSubmit={handleSubmit(onSubmit)}>
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
  );
}
