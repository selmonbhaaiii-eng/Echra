import { ConnectGBPWizard } from "@/components/dashboard/ConnectGBPWizard";

export default function ConnectPage({
  searchParams,
}: {
  searchParams: { connected?: string; synced?: string; error?: string };
}) {
  return (
    <ConnectGBPWizard
      connected={searchParams.connected === "true"}
      synced={searchParams.synced ?? null}
      error={searchParams.error ?? null}
    />
  );
}
