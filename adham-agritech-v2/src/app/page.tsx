import { Sidebar } from "@/components/layout/Sidebar";
import { CommandCenter } from "@/components/dashboard/CommandCenter";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text">
      <Sidebar />
      <div className="lg:ml-64">
        <header className="border-b border-primary/10 bg-black/60 px-6 py-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Adham AgriTech</p>
          <h1 className="mt-3 text-4xl font-semibold text-primary">Sentinel Command Center</h1>
          <p className="mt-2 text-muted">
            Zero-input ESODA intelligence fused with Sentinel Hub and TorchGeo logic.
          </p>
        </header>
        <section className="px-6 py-10">
          <CommandCenter />
        </section>
      </div>
    </main>
  );
}
