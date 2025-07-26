import "@/i18n";
import { useUserStore } from "@/store";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function IndexPage() {
  const { isLogin, rehydrated } = useUserStore();

  useEffect(() => {
    console.log("Index Page - isLogin:", isLogin, "rehydrated:", rehydrated);
  }, [isLogin, rehydrated]);

  if (!rehydrated) {
    return null;
  }

  if (isLogin) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/(auth)/preLogin" />;
  }
}
