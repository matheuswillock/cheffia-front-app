"use client";

import { useParams } from "next/navigation";
import { DashboardFeatureProvider } from "@/app/dashboard/[slug]/features/context/DashboardFeatureContext";
import { DashboardOverviewContainer } from "@/app/dashboard/[slug]/features/container/DashboardOverviewContainer";

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <DashboardFeatureProvider slug={slug}>
      <DashboardOverviewContainer />
    </DashboardFeatureProvider>
  );
}
