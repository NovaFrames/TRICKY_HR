import { useUser } from "@/context/UserContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, isLoading } = useUser();

  if (isLoading) return null;

  return user ? (
    <Redirect href="/(tabs)/dashboard" />
  ) : (
    <Redirect href="/auth/login" />
  );
}
