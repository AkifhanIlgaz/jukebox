"use client";

import { Button, Card, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { getErrorMessage } from "@/api/client";
import { addSongSchema, type AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";
import { useAddToQueue } from "@/features/queue/hooks/useAddToQueue";

export function AddToQueueForm() {
  const addToQueueMutation = useAddToQueue();

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
    addToQueueMutation.mutate(values, {
      onSuccess: () => reset(),
      onError: (error) => {
        setError("youtubeUrl", { message: getErrorMessage(error) });
      },
    });
  }

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 text-base font-semibold">Sıraya ekle</div>
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
          <Button isDisabled={addToQueueMutation.isPending} type="submit" variant="primary">
            {addToQueueMutation.isPending ? "Ekleniyor..." : "Ekle"}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
