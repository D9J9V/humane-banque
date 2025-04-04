import { AppLayout } from "@/components/Core/AppLayout";
import { ReactNode } from "react";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
