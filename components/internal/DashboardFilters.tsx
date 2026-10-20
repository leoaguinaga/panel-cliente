'use client';

import { useTransition, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  User,
  Package,
  Briefcase,
  Activity,
  RotateCcw,
  X,
  Loader2,
} from 'lucide-react';

type EntityOption = { id: string; name: string };

type DashboardFiltersProps = {
  workers: EntityOption[];
  products: EntityOption[];
  services: EntityOption[];
  initialFilters?: {
    workerId?: string;
    productId?: string;
    serviceId?: string;
    status?: string;
  };
};

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planificación' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PAUSED', label: 'Pausado' },
];

export function DashboardFilters({
  workers,
  products,
  services,
  initialFilters = {},
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentWorkerId = searchParams.get('workerId') ?? initialFilters.workerId ?? '';
  const currentProductId = searchParams.get('productId') ?? initialFilters.productId ?? '';
  const currentServiceId = searchParams.get('serviceId') ?? initialFilters.serviceId ?? '';
  const currentStatus = searchParams.get('status') ?? initialFilters.status ?? '';

  const activeFiltersCount = [
    currentWorkerId,
    currentProductId,
    currentServiceId,
    currentStatus,
  ].filter(Boolean).length;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const activeWorkerName = useMemo(
    () => workers.find((w) => w.id === currentWorkerId)?.name,
    [workers, currentWorkerId]
  );
  const activeProductName = useMemo(
    () => products.find((p) => p.id === currentProductId)?.name,
    [products, currentProductId]
  );
  const activeServiceName = useMemo(
    () => services.find((s) => s.id === currentServiceId)?.name,
    [services, currentServiceId]
  );
  const activeStatusLabel = useMemo(
    () => STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label,
    [currentStatus]
  );

  return (
    <div className="rounded-xl border bg-card/70 p-4 shadow-2xs backdrop-blur-xs transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="size-4 text-primary" />
          <span>Filtros del centro operativo</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
              {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Actualizando...</span>
            </div>
          )}
          {activeFiltersCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={clearAllFilters}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Responsable */}
        <div className="space-y-1.5">
          <label htmlFor="dashboard-worker" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="size-3.5 text-muted-foreground/80" />
            <span>Responsable</span>
          </label>
          <Select
            value={currentWorkerId || 'all'}
            onValueChange={(val) => updateFilter('workerId', val)}
            disabled={isPending}
          >
            <SelectTrigger id="dashboard-worker"
              aria-label="Responsable"
              className={
                currentWorkerId
                  ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                  : ''
              }
            >
              <SelectValue placeholder="Todos los responsables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los responsables</SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Producto */}
        <div className="space-y-1.5">
          <label htmlFor="dashboard-product" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Package className="size-3.5 text-muted-foreground/80" />
            <span>Producto</span>
          </label>
          <Select
            value={currentProductId || 'all'}
            onValueChange={(val) => updateFilter('productId', val)}
            disabled={isPending}
          >
            <SelectTrigger id="dashboard-product"
              aria-label="Producto"
              className={
                currentProductId
                  ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                  : ''
              }
            >
              <SelectValue placeholder="Todos los productos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Servicio */}
        <div className="space-y-1.5">
          <label htmlFor="dashboard-service" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Briefcase className="size-3.5 text-muted-foreground/80" />
            <span>Servicio</span>
          </label>
          <Select
            value={currentServiceId || 'all'}
            onValueChange={(val) => updateFilter('serviceId', val)}
            disabled={isPending}
          >
            <SelectTrigger id="dashboard-service"
              aria-label="Servicio"
              className={
                currentServiceId
                  ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                  : ''
              }
            >
              <SelectValue placeholder="Todos los servicios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
          <label htmlFor="dashboard-status" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Activity className="size-3.5 text-muted-foreground/80" />
            <span>Estado del proyecto</span>
          </label>
          <Select
            value={currentStatus || 'all'}
            onValueChange={(val) => updateFilter('status', val)}
            disabled={isPending}
          >
            <SelectTrigger id="dashboard-status"
              aria-label="Estado del proyecto"
              className={
                currentStatus
                  ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                  : ''
              }
            >
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <span className="text-xs text-muted-foreground">Filtros activos:</span>

          {currentWorkerId && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-normal"
            >
              <span className="text-muted-foreground">Responsable:</span>
              <span className="font-medium text-foreground">{activeWorkerName || currentWorkerId}</span>
              <button
                type="button"
                onClick={() => updateFilter('workerId', 'all')}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                aria-label={`Quitar filtro ${activeWorkerName}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentProductId && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-normal"
            >
              <span className="text-muted-foreground">Producto:</span>
              <span className="font-medium text-foreground">{activeProductName || currentProductId}</span>
              <button
                type="button"
                onClick={() => updateFilter('productId', 'all')}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                aria-label={`Quitar filtro ${activeProductName}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentServiceId && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-normal"
            >
              <span className="text-muted-foreground">Servicio:</span>
              <span className="font-medium text-foreground">{activeServiceName || currentServiceId}</span>
              <button
                type="button"
                onClick={() => updateFilter('serviceId', 'all')}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                aria-label={`Quitar filtro ${activeServiceName}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {currentStatus && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-normal"
            >
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-medium text-foreground">{activeStatusLabel || currentStatus}</span>
              <button
                type="button"
                onClick={() => updateFilter('status', 'all')}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                aria-label={`Quitar filtro ${activeStatusLabel}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
