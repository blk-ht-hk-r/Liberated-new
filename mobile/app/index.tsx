import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";

export default function Index() {
  const status = useAuth((state) => state.status);
  return (
    <Redirect
      href={status === "authenticated" ? "/(app)/home" : "/(auth)/login"}
    />
  );
}
