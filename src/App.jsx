import { useEffect, useState } from "react";
import {
  Show,
  SignIn,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/react";
import { FiDollarSign, FiLogIn, FiLogOut, FiUserPlus } from "react-icons/fi";
import CategoriesPage from "./pages/CategoriesPage";
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  const { isLoaded } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem("salimspend-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("salimspend-theme", theme);
  }, [theme]);

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
      <header className="flex min-h-[72px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-8 text-[var(--text-primary)] max-[720px]:min-h-0 max-[720px]:flex-wrap max-[720px]:gap-4 max-[720px]:px-5 max-[720px]:py-[18px]">
        <a
          className="inline-flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] no-underline"
          href="/"
        >
          <FiDollarSign className="text-[var(--brand)]" aria-hidden="true" />
          SalimSpend
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
            <SignOutButton>
              <button
                type="button"
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[15px] leading-none text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2"
              >
                <FiLogOut aria-hidden="true" />
                Sign out
              </button>
            </SignOutButton>
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        <Show when="signed-out">
          <section className="grid min-h-[calc(100svh-73px)] grid-cols-2 bg-[#f5f5f1] text-left max-[760px]:grid-cols-1">
            <div className="flex flex-col items-center justify-center border-r border-[#d9e4dc] bg-[#dce9e1] px-10 py-14 text-center max-[760px]:min-h-[280px] max-[760px]:border-b max-[760px]:border-r-0 max-[560px]:px-6 max-[560px]:py-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                SalimSpend / Welcome back
              </p>
              <h1 className="mt-5 max-w-[320px] font-serif text-[clamp(34px,4vw,50px)] font-normal leading-[1.04] text-[#183b34]">
                Your money, in one clear place.
              </h1>
              <div
                className="mt-8 grid h-20 w-20 place-items-center rounded-full border-8 border-[#b8d1ae] bg-[#fffefa] font-serif text-2xl text-[#0f766e] shadow-[0_10px_18px_rgba(15,118,110,0.14)]"
                aria-hidden="true"
              >
                S
              </div>
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
            />
          : activeView === "settings" ?
            <SettingsPage
              currentView={activeView}
              onSelectView={setActiveView}
              theme={theme}
              onToggleTheme={() =>
                setTheme((currentTheme) =>
                  currentTheme === "dark" ? "light" : "dark",
                )
              }
            />
          : <Dashboard currentView={activeView} onSelectView={setActiveView} />}
        </Show>
      </main>
    </>
  );
}

export default App;
