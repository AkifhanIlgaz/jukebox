"use client";

import { Button, Card, EmptyState, Spinner, Table, Tooltip } from "@heroui/react";
import { Trash2, Users } from "lucide-react";

import { CreateAdminForm } from "@/features/admin/components/CreateAdminForm";
import { useDeleteAdmin } from "@/features/admin/hooks/useDeleteAdmin";
import { useVenueUsers } from "@/features/admin/hooks/useVenueUsers";

const ROLE_LABELS = {
  boss: "Big Boss",
  admin: "Admin",
} as const;

export function VenueUsersTable() {
  const usersQuery = useVenueUsers();
  const deleteAdminMutation = useDeleteAdmin();

  const users = usersQuery.data ?? [];

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-base font-semibold">Kullanıcılar</div>
        <CreateAdminForm />
      </div>
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="Kullanıcılar" className="min-w-100">
            <Table.Header>
              <Table.Column isRowHeader>Kullanıcı adı</Table.Column>
              <Table.Column>Rol</Table.Column>
              <Table.Column className="text-end">Aksiyonlar</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() =>
                usersQuery.isLoading ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-8 text-center">
                    <Spinner size="md" />
                    <span className="text-sm font-medium">Kullanıcılar yükleniyor...</span>
                  </div>
                ) : (
                  <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-2 py-8 text-center">
                    <Users className="size-8 text-muted" />
                    <span className="text-sm font-medium">Kullanıcı bulunamadı</span>
                  </EmptyState>
                )
              }
            >
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell className="text-sm font-medium">{user.username}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "boss"
                          ? "bg-accent/10 text-accent"
                          : "bg-surface-tertiary text-muted"
                      }`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-end">
                    {user.role === "admin" ? (
                      <Tooltip delay={0}>
                        <Tooltip.Trigger aria-label="Admini sil">
                          <Button
                            isIconOnly
                            isPending={
                              deleteAdminMutation.isPending &&
                              deleteAdminMutation.variables?.id === user.id
                            }
                            size="sm"
                            variant="danger-soft"
                            onPress={() =>
                              deleteAdminMutation.mutate({ id: user.id, username: user.username })
                            }
                          >
                            {({ isPending }) =>
                              isPending ? (
                                <Spinner color="current" size="sm" />
                              ) : (
                                <Trash2 className="size-4" />
                              )
                            }
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content showArrow placement="top">
                          <Tooltip.Arrow />
                          <p className="text-xs font-medium">Sil</p>
                        </Tooltip.Content>
                      </Tooltip>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </Card>
  );
}
