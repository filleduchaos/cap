import { cx } from "cva";
import {
  Match,
  Switch,
  createEffect,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { makePersisted } from "@solid-primitives/storage";
import { createStore } from "solid-js/store";
import Header from "../components/Header";
import LoadingScreen from "../components/LoadingScreen";
import { Button } from "@cap/ui-solid";
import { AuthError, AuthState, signIn } from "../utils/auth";
import { createMutation } from "@tanstack/solid-query";

export default function () {
  const navigate = useNavigate();
  const [state, setState] = makePersisted(
    createStore<AuthState>({
      skipped: false,
      session: null,
    }, { name: "auth-data" })
  );

  const signInAttempt = createMutation(() => ({
    mutationFn: signIn,
  }));

  createEffect(() => {
    if (signInAttempt.isSuccess) {
      setState("session", signInAttempt.data);
    }
    else if (signInAttempt.isError) {
      setState("session", null);
      const error = signInAttempt.error;
      console.error(error);
      if (error instanceof AuthError) window.alert(error.message);
      signInAttempt.reset();
    }

    if (state.skipped || !!state.session) {
      navigate("/", { replace: true });
    }
  });

  const handleSignIn = () => {
    setState("skipped", false);
    signInAttempt.mutate();

    // Give ten minutes to log in?
    setTimeout(() => signInAttempt.reset(), 600 * 1000);
  }

  const handleSkip = () => {
    setState("skipped", true);
  }

  return (
    <div
      class="rounded-[1.5rem] bg-gray-50 border border-gray-200 w-screen h-screen flex flex-col overflow-hidden"
    >
      <Header />
      <div class="flex flex-1 flex-col p-[1rem] gap-[0.75rem] text-[0.875rem] font-[400] bg-gray-100">
        <Switch fallback={<LoadingScreen />}>
          <Match when={signInAttempt.isIdle}>
            <IconCapLogo class="size-[3rem]" />
            <h6 class="mb-0 text-lg font-semibold">Connect a Cap account</h6>
            <p class="text-gray-400 mb-4">Effortless, instant screen sharing. Open source and cross-platform.</p>
            <Button onClick={handleSignIn}>Connect with your browser</Button>
            <Button variant="secondary" onClick={handleSkip}>Skip (local use only)</Button>
          </Match>
        </Switch>
      </div>
    </div>
  )
}
