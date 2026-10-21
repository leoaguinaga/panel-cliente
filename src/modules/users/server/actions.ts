"use server";
import { BackendApiError, backendFetch } from "@/src/lib/api/server";
import { requireAuth } from "@/src/lib/auth";
import { ROLES } from "@/src/modules/auth/server/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const field = (data: FormData, name: string) =>
  String(data.get(name) || "").trim();
export async function createWorkerAction(data: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const worker = await backendFetch<{ id: string }>("/workers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: field(data, "name"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      jobTitle: field(data, "jobTitle"),
      role: field(data, "role") || "WORKER",
    }),
  });
  revalidatePath("/internal/workers");
  return worker;
}
export async function updateWorkerAction(id: string, data: FormData) {
  await requireAuth([ROLES.ADMIN]);
  await backendFetch(`/workers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: field(data, "name"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      jobTitle: field(data, "jobTitle"),
      role: field(data, "role"),
      status: field(data, "status"),
    }),
  });
  revalidatePath("/internal/workers");
  revalidatePath(`/internal/workers/${id}`);
}
export async function sendWorkerLinkAction(id: string) {
  await requireAuth([ROLES.ADMIN]);
  await backendFetch(`/workers/${id}/password-email`, { method: "POST" });
  revalidatePath(`/internal/workers/${id}`);
}

export async function createWorkerProfileAction(
  _previous: { error: string | null },
  data: FormData,
): Promise<{ error: string | null }> {
  let id: string;
  try {
    id = (await createWorkerAction(data)).id;
  } catch (error) {
    // Si solo falló el correo, la cuenta ya existe: refresca el listado.
    revalidatePath("/internal/workers");
    return {
      error:
        error instanceof BackendApiError
          ? error.message
          : "No se pudo crear el trabajador. Vuelve a intentarlo.",
    };
  }
  redirect(`/internal/workers/${id}`);
}

export async function updateWorkerFormAction(data: FormData) {
  return updateWorkerAction(field(data, "workerId"), data);
}
export async function sendWorkerLinkFormAction(data: FormData) {
  return sendWorkerLinkAction(field(data, "workerId"));
}
