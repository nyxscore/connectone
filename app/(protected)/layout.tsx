import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const session = await getServerSession(authOptions);

  // Firebase Auth 사용자 또는 NextAuth 세션이 있으면 허용
  if (!user && !session) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
