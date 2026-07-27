"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { getErrorMessage } from "@/api/client";
import { useCreateAdmin } from "@/features/admin/hooks/useCreateAdmin";
import { PasswordField } from "@/features/auth/components/PasswordField";
import {
  createAdminSchema,
  type CreateAdminFormValues,
} from "@/features/admin/schemas/create-admin-schema";

export function CreateAdminForm() {
  const state = useOverlayState();
  const createAdminMutation = useCreateAdmin();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", password: "" },
  });

  function onOpenChange(open: boolean) {
    state.setOpen(open);
    if (!open) reset();
  }

  function onSubmit(values: CreateAdminFormValues) {
    createAdminMutation.mutate(values, {
      onSuccess: () => {
        reset();
        state.close();
      },
      onError: (error) => {
        setError("username", { message: getErrorMessage(error) });
      },
    });
  }

  return (
    <>
      <Button size="sm" variant="primary" onPress={state.open}>
        <Plus className="size-4" />
        Yeni admin ekle
      </Button>

      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Yeni admin ekle</Modal.Heading>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Modal.Body className="flex flex-col gap-4">
                <Controller
                  control={control}
                  name="username"
                  render={({ field }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!errors.username}
                      isRequired
                      name={field.name}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                    >
                      <Label>Kullanıcı adı</Label>
                      <Input placeholder="kahvediyari-admin" />
                      <FieldError>{errors.username?.message}</FieldError>
                    </TextField>
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <PasswordField
                      isRequired
                      name={field.name}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      label="Şifre"
                      errorMessage={errors.password?.message}
                    />
                  )}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">
                  Vazgeç
                </Button>
                <Button isDisabled={createAdminMutation.isPending} type="submit" variant="primary">
                  {createAdminMutation.isPending ? "Ekleniyor..." : "Ekle"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
