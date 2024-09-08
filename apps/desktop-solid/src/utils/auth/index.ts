import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen as tauriListen } from "@tauri-apps/api/event";
import * as tauriShell from "@tauri-apps/plugin-shell";

import callbackTemplate from "./callback.template";

export class AuthError extends Error {
  public readonly originalError: Error | undefined;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.originalError = originalError;
  }
}

export type AuthState = {
  skipped: boolean,
  session: AuthPayload | null,
}

export type AuthPayload = {
  token: string,
  expires: string,
}

export function signIn(): Promise<AuthPayload | null> {
  return new Promise((resolve, reject) => {
    console.log("Starting login attempt");

    tauriListen("oauth://url", (event: { payload: string }) => {
      const urlObject = new URL(event.payload);
      const token = urlObject.searchParams.get("token");
      const expires = urlObject.searchParams.get("expires");

      if (!token || !expires) {
        reject(new AuthError("Missing auth token or expiry time"));
      }
      else {
        // if (window.fathom) {
        //   window.fathom.trackEvent("signin_success");
        // }
        resolve({ token, expires });
      }
    })
    .catch((error) => {
      reject(new AuthError("Error while waiting for OAuth result", error));
    });

    tauriInvoke("plugin:oauth|start", { config: { response: callbackTemplate } })
      .then(launchSignIn)
      .catch((error) => {
        reject(new AuthError("Error while launching OAuth", error));
      });
  });
}

function launchSignIn(port: unknown): Promise<void> {
  return tauriShell.open(
    // TODO: Replace env variable with setting
    `${import.meta.env.VITE_SERVER_URL}/api/desktop/session/request?port=${port}`
  );
}
