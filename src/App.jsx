import { useEffect, useState } from "react";
import {
  Show,
  SignIn,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/react";
import { FiLogIn, FiUserPlus } from "react-icons/fi";
import packageJson from "../package.json";
import {
  DEFAULT_CURRENCY,
  DEFAULT_THEME,
  clearAppStorage,
  getSettingsExportPayload,
  getStoredCurrency,
  getStoredTheme,
  normalizeCurrencyCode,
} from "./lib/settings";
import { createSupabaseClient } from "./lib/supabase";
import ConfirmationModal from "./components/ConfirmationModal";
import CategoriesPage from "./pages/CategoriesPage";
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [currency, setCurrency] = useState(() => getStoredCurrency());
  const [transactionsRevision, setTransactionsRevision] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [confirmationState, setConfirmationState] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("salimspend-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("salimspend-currency", currency);
  }, [currency]);

  const handleExportData = () => {
    const payload = getSettingsExportPayload({
      theme,
      currency,
      appVersion: packageJson.version,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `salimspend-settings-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    setResetStatus(null);
    setIsResetting(true);

    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error(
          "Authentication is required to reset application data.",
        );
      }

      const supabase = createSupabaseClient(getToken);
      const { error } = await supabase.rpc("reset_user_data");

      if (error) {
        throw error;
      }

      clearAppStorage();
      setTheme(DEFAULT_THEME);
      setCurrency(DEFAULT_CURRENCY);
      setResetStatus({
        type: "success",
        message:
          "Your SalimSpend data has been reset. Your account is unchanged.",
      });
    } catch (error) {
      console.error("Unable to reset SalimSpend application data.", error);
      setResetStatus({
        type: "error",
        message:
          "The reset could not be confirmed. Reload to check your data before trying again.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetDataRequest = () => {
    setConfirmationState({
      title: "Reset all data?",
      message:
        "This permanently deletes your SalimSpend transactions, categories, payment methods, and saved preferences. It does not delete your Clerk account or sign you out.",
      confirmLabel: "Reset data",
      destructive: true,
      onConfirm: async () => {
        setConfirmationState(null);
        await handleResetData();
      },
      onCancel: () => setConfirmationState(null),
    });
  };

  if (!isLoaded) {
    return (
      <main
        className="grid min-h-screen place-items-center p-8 text-[#817889]"
        aria-live="polite"
      >
        Loading SalimSpend...
      </main>
    );
  }

  return (
    <>
      <header className="flex min-h-[105px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-8 text-[var(--text-primary)] max-[720px]:min-h-0 max-[720px]:flex-wrap max-[720px]:gap-4 max-[720px]:px-5 max-[720px]:py-[18px]">
        <a
          className="inline-flex items-center text-[var(--text-primary)] no-underline"
          href="/"
          aria-label="SalimSpend home"
        >
          <img
            className="app-header-logo h-[97px] w-[150px] object-contain"
            src="/ui-reference/logo1.png"
            alt=""
            aria-hidden="true"
          />
        </a>
        <nav
          className="flex min-h-10 items-center gap-[10px] max-[720px]:flex-wrap max-[720px]:justify-end"
          aria-label="Authentication"
        >
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[15px] leading-none text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2"
              >
                <FiLogIn aria-hidden="true" />
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[6px] border border-transparent bg-[var(--brand)] px-4 text-[15px] font-bold leading-none text-white transition hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2"
              >
                <FiUserPlus aria-hidden="true" />
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        <ConfirmationModal
          isOpen={Boolean(confirmationState)}
          title={confirmationState?.title ?? "Confirm action"}
          message={confirmationState?.message ?? ""}
          confirmLabel={confirmationState?.confirmLabel ?? "Confirm"}
          cancelLabel="Cancel"
          destructive={Boolean(confirmationState?.destructive)}
          isConfirming={isResetting}
          onConfirm={
            confirmationState?.onConfirm ?? (() => setConfirmationState(null))
          }
          onCancel={
            confirmationState?.onCancel ?? (() => setConfirmationState(null))
          }
        />

        <Show when="signed-out">
          <section className="grid min-h-[calc(100svh-73px)] grid-cols-2 bg-[#f5f5f1] text-left max-[760px]:grid-cols-1">
            <div className="flex flex-col items-center justify-center border-r border-[#d9e4dc] bg-[#dce9e1] px-10 py-14 text-center max-[760px]:min-h-[280px] max-[760px]:border-b max-[760px]:border-r-0 max-[560px]:px-6 max-[560px]:py-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                SalimSpend / Welcome back
              </p>
              <h1 className="mt-5 max-w-[320px] font-serif text-[clamp(34px,4vw,50px)] font-normal leading-[1.04] text-[#183b34]">
                Your money, in one clear place.
              </h1>
              <img
                className="mt-6 h-[149px] w-[230px] object-contain mix-blend-darken"
                src="/ui-reference/logo1.png"
                alt="SalimSpend logo"
              />
            </div>
            <div className="flex items-center justify-center bg-[#f8f8f5] px-10 py-14 max-[760px]:px-6 max-[760px]:py-10">
              <div className="w-full max-w-[390px]">
                <div className="mb-5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                    Secure access
                  </p>
                  <h2 className="mt-2 font-serif text-[30px] font-normal tracking-[-0.01em] text-[#183b34]">
                    Sign in
                  </h2>
                  <p className="mt-2 text-sm text-[#7b8580]">
                    Continue to your personal finance workspace.
                  </p>
                </div>
                <SignIn
                  appearance={{
                    variables: {
                      colorPrimary: "#0f766e",
                      colorText: "#213b36",
                      colorTextSecondary: "#7b8580",
                      colorBackground: "#fffefa",
                      borderRadius: "6px",
                    },
                    elements: {
                      card: "!w-full !max-w-none !rounded-[8px] !border !border-[#e0e5df] !bg-[#fffefa] !p-6 !shadow-[0_10px_24px_rgba(35,49,47,0.05)] max-[560px]:!p-4",
                      headerTitle: "!hidden",
                      headerSubtitle: "!hidden",
                      footer: "!bg-transparent",
                      formButtonPrimary:
                        "!bg-[#0f766e] !text-white hover:!bg-[#115e59]",
                      socialButtonsBlockButton:
                        "!border-[#d9e1dc] !bg-white !text-[#213b36] hover:!bg-[#f1f6f2]",
                      formFieldInput:
                        "!border-[#d9e1dc] !bg-white !text-[#213b36] focus:!border-[#0f766e]",
                      formFieldLabel: "!text-[#50615b]",
                      footerActionLink: "!text-[#0f766e]",
                    },
                  }}
                />
              </div>
            </div>
          </section>
        </Show>
        <Show when="signed-in">
          {activeView === "transactions" ?
            <TransactionsPage
              currentView={activeView}
              onSelectView={setActiveView}
              currency={currency}
              onTransactionsChanged={() =>
                setTransactionsRevision((revision) => revision + 1)
              }
            />
          : activeView === "categories" ?
            <CategoriesPage
              currentView={activeView}
              onSelectView={setActiveView}
            />
          : activeView === "reports" ?
            <ReportsPage
              currentView={activeView}
              onSelectView={setActiveView}
              currency={currency}
              transactionsRevision={transactionsRevision}
            />
          : activeView === "settings" ?
            <SettingsPage
              currentView={activeView}
              onSelectView={setActiveView}
              theme={theme}
              currency={currency}
              appVersion={packageJson.version}
              isResetting={isResetting}
              resetStatus={resetStatus}
              onToggleTheme={() =>
                setTheme((currentTheme) =>
                  currentTheme === "dark" ? "light" : "dark",
                )
              }
              onCurrencyChange={(nextCurrency) =>
                setCurrency(normalizeCurrencyCode(nextCurrency))
              }
              onExportData={handleExportData}
              onResetAllData={handleResetDataRequest}
            />
          : <Dashboard
              currentView={activeView}
              onSelectView={setActiveView}
              currency={currency}
              transactionsRevision={transactionsRevision}
            />
          }
        </Show>
      </main>
    </>
  );
}

export default App;
