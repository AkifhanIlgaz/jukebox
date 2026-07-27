"use client";

import { Button, FieldError, Form, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { getErrorMessage } from "@/api/client";
import { useAddTrack } from "@/features/playlist/hooks/useAddTrack";
import { addSongSchema, type AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";

export function AddSongForm() {
  const state = useOverlayState();
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

  function onOpenChange(open: boolean) {
    state.setOpen(open);
    if (!open) reset();
  }

  function onSubmit(values: AddSongFormValues) {
    addSongMutation.mutate(values, {
      onSuccess: () => {
        reset();
        state.close();
      },
      onError: (error) => {
        setError("youtubeUrl", { message: getErrorMessage(error) });
      },
    });
  }

  return (
    <>
      <Button size="sm" variant="primary" onPress={state.open}>
        <Plus className="size-4" />
        Şarkı ekle
      </Button>

      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Şarkı ekle</Modal.Heading>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Modal.Body>
                <Controller
                  control={control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!errors.youtubeUrl}
                      isRequired
                      name={field.name}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                    >
                      <Label>YouTube linki</Label>
                      <Input placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
                      <FieldError>{errors.youtubeUrl?.message}</FieldError>
                    </TextField>
                  )}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">
                  Vazgeç
                </Button>
                <Button isDisabled={addSongMutation.isPending} type="submit" variant="primary">
                  {addSongMutation.isPending ? "Ekleniyor..." : "Ekle"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
