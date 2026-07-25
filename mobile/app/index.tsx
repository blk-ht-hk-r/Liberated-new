import { Redirect } from "expo-router";

/** Entry point - routing is handled by the auth gate in the root layout. */
export default function Index() {
  return <Redirect href="/(app)/home" />;
}
