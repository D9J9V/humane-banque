import { PayBlock } from "@/components/(legacy)/Pay";
import { SignIn } from "@/components/(legacy)/SignIn";
import { VerifyBlock } from "@/components/(legacy)/Verify";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-y-3">
      <SignIn />
      <VerifyBlock />
      <PayBlock />
    </main>
  );
}
