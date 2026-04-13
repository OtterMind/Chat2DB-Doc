import { useEffect, useState } from "react";
import Script from "next/script";

const ONE_TAP_SESSION_KEY = "chat2db_google_one_tap_prompted";
const GOOGLE_ONE_TAP_CLIENT_ID =
  "1082889006101-vvt2hjqb1ic211d3dinruc6lj3jurapp.apps.googleusercontent.com";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") return "https://app.chat2db-ai.com";
  const hostname = window.location.hostname;
  if (hostname.includes("chat2db.ai") && !hostname.includes("chat2db-ai.com")) {
    return "https://app.chat2db.ai";
  }
  return "https://app.chat2db-ai.com";
};

const isChromeBrowser = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
};

export default function GoogleOneTap() {
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !isChromeBrowser()) return;
    if (sessionStorage.getItem(ONE_TAP_SESSION_KEY) === "1") return;

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) return;

    googleIdentity.initialize({
      client_id: GOOGLE_ONE_TAP_CLIENT_ID,
      callback: async ({ credential }) => {
        if (!credential) return;
        try {
          await fetch(`${getApiBaseUrl()}/api/oauth/google_one_tap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential, appCode: "chat2db" }),
          });
          sessionStorage.setItem(ONE_TAP_SESSION_KEY, "1");
        } catch (error) {
          console.error("[GoogleOneTap] login failed", error);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
    });

    googleIdentity.prompt();

    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, [scriptReady]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptReady(true)}
    />
  );
}
