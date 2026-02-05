import { PropertyForm } from "@/components/landowner/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          New listing
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Create a new property
        </h1>
      </div>
      <PropertyForm />
    </div>
  );
}
