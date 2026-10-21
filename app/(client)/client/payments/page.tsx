import { ClientPaymentsView } from "@/components/client/ClientPaymentsView";
import { getClientDashboard } from "@/src/modules/dashboard/server/queries";

import { getPortalSettings } from "@/src/modules/settings/server/queries";
import { configuredPaymentChannels } from "@/src/modules/settings/payment-channels";
import { taxFields } from "@/src/modules/settings/types";

export default async function ClientPaymentsPage() {
  const [{ payments }, settings] = await Promise.all([
    getClientDashboard(),
    getPortalSettings(),
  ]);

  return (
    <>
      <ClientPaymentsView
        payments={payments}
        channels={configuredPaymentChannels(settings.payment_methods)}
        instructions={settings.payment_instructions}
        fiscalInformation={
          (taxFields.some(([key]) => settings[key]) ||
            settings.tax_information) && (
            <details className="py-6">
              <summary className="cursor-pointer text-sm font-semibold">
                Datos fiscales de FoxCode
              </summary>
              <dl className="mt-4 grid gap-5">
                {taxFields
                  .filter(([key]) => settings[key])
                  .map(([key, label]) => (
                    <div key={key}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words text-sm">
                        {settings[key]}
                      </dd>
                    </div>
                  ))}
              </dl>
              {settings.tax_information && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                  {settings.tax_information}
                </p>
              )}
            </details>
          )
        }
      />
    </>
  );
}
