import { AppLayout } from "@/components/Core/AppLayout";
import { ReactNode } from "react";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  // This layout wraps all routes inside the (main) group
  return <AppLayout>{children}</AppLayout>;
}
