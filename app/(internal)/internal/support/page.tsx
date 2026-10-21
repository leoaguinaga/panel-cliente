import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { SupportRequests } from '@/src/modules/support/SupportRequests';
import type { TicketList } from '@/src/modules/support/types';
import s from '@/src/modules/support/support.module.css';
export default async function SupportPage(){await requireAuth(['ADMIN','WORKER']);const tickets=await backendFetch<TicketList>('/support');return <div className={s.root}><div className={s.intro}><div><h1>Atención al cliente</h1><p>Consultas, incidencias y conversaciones del portal de clientes.</p></div></div><div className="mt-8"><SupportRequests initial={tickets} internal/></div></div>}
