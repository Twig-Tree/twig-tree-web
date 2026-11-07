import { notFound } from "next/navigation";
import { DemoTreeCreator } from "@/src/features/lecture/create-demo-tree";
import { AuthGate } from "@/src/shared/lib/auth/AuthGate";

export default function DemoTreesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AuthGate>
      <DemoTreeCreator />
    </AuthGate>
  );
}
