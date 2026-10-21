"use client";
import { Skeleton } from "boneyard-js/react";
export function CalendarGridLoading() {
  const fixture = (
    <div
      className="overflow-hidden rounded-lg border bg-card"
      aria-hidden="true"
    >
      <div className="grid grid-cols-7 border-b">
        {Array.from({ length: 7 }, (_, i) => (
          <div className="p-3" key={i}>
            <div className="mx-auto h-3 w-6 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }, (_, i) => (
          <div className="h-[70px] border-b border-r p-2 sm:h-[105px]" key={i}>
            <div className="h-4 w-4 rounded bg-muted" />
            {[9, 15, 20, 21, 24, 30].includes(i) && (
              <div className="mt-3 h-3 w-full rounded bg-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div role="status" aria-label="Cargando calendario">
      <Skeleton
        name="calendar-grid"
        loading
        fixture={fixture}
        fallback={fixture}
        select="viewport"
      >
        {fixture}
      </Skeleton>
    </div>
  );
}
export function CalendarLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-3">
          <div className="h-10 w-40 rounded bg-muted" />
          <div className="h-4 w-64 max-w-full rounded bg-muted" />
        </div>
      </div>
      <div className="h-12 w-full rounded bg-muted" />
      <CalendarGridLoading />
    </div>
  );
}
