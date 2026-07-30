/**
 * File: apps/admin/src/app/(admin)/dashboard/services/page.tsx
 * Purpose: Service configuration — enable/disable providers, set
 *          failover priority, enable/disable catalog services, edit
 *          fixed prices.
 */
import type { Metadata } from "next";
import {
  listAllProviders,
  listAllServices,
} from "@/features/services/services/service-admin-service";
import { ProviderRow } from "@/features/services/components/provider-row";
import { ServiceRow } from "@/features/services/components/service-row";

export const metadata: Metadata = {
  title: "Service Configuration — Credixa Admin",
};

export default async function ServicesPage() {
  const [providers, services] = await Promise.all([
    listAllProviders(),
    listAllServices(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Service Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage VTU providers and the purchasable service catalog.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Providers</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Supports</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((p) => (
                <ProviderRow key={p.id} provider={p} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Services</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Network</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
