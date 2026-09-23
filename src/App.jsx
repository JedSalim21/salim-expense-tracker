import {
  Show,
  SignIn,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/react";

const summaryCards = [
  {
    label: "Total balance",
    value: "₱12,480.60",
    detail: "+8.4% from last month",
    tone: "teal",
  },
  {
    label: "This month's income",
    value: "₱6,840.00",
    detail: "+12.1% from last month",
    tone: "blue",
  },
  {
    label: "This month's expenses",
    value: "₱3,290.40",
    detail: "-4.6% from last month",
    tone: "amber",
  },
  {
    label: "Available to save",
    value: "₱3,549.60",
    detail: "52% of monthly income",
    tone: "rose",
  },
];

const toneClasses = {
  teal: "text-[#0f766e]",
  blue: "text-[#3c72a2]",
  amber: "text-[#c08222]",
  rose: "text-[#b86c83]",
};

const transactions = [
  {
    merchant: "Whole Foods Market",
    category: "Groceries",
    date: "Today, 09:42",
    amount: "-₱86.24",
    color: "green",
    glyph: "W",
  },
  {
    merchant: "Notion",
    category: "Subscriptions",
    date: "Yesterday, 16:10",
    amount: "-₱12.00",
    color: "violet",
    glyph: "N",
  },
  {
    merchant: "Northstar Studio",
    category: "Freelance income",
    date: "Sep 18, 11:25",
    amount: "+₱1,250.00",
    color: "yellow",
    glyph: "N",
  },
  {
    merchant: "Metro Transit",
    category: "Transport",
    date: "Sep 17, 08:04",
    amount: "-₱42.80",
    color: "blue",
    glyph: "M",
  },
];

const avatarClasses = {
  green: "bg-[#dcece1] text-[#27735f]",
  violet: "bg-[#eae1f0] text-[#765e99]",
  yellow: "bg-[#f7e9bc] text-[#87641d]",
  blue: "bg-[#dcebf4] text-[#376a92]",
};

const spendingCategories = [
  { label: "Home", amount: "₱1,120", percent: 34, color: "#0f766e" },
  { label: "Food", amount: "₱738", percent: 22, color: "#f59e0b" },
  { label: "Transport", amount: "₱462", percent: 14, color: "#3b82f6" },
  { label: "Lifestyle", amount: "₱386", percent: 12, color: "#e879a8" },
];

const navigation = [
  ["01", "Dashboard", "#dashboard"],
  ["02", "Transactions", "#transactions"],
  ["03", "Categories", "#categories"],
  ["04", "Reports", "#reports"],
  ["05", "Settings", "#settings"],
];

const cashFlow = [
  { month: "Apr", income: 63, expenses: 36 },
  { month: "May", income: 72, expenses: 42 },
  { month: "Jun", income: 57, expenses: 35 },
  { month: "Jul", income: 82, expenses: 46 },
  { month: "Aug", income: 68, expenses: 40 },
  { month: "Sep", income: 88, expenses: 44 },
];

function Dashboard() {
  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[#f8f7f3] text-left text-[#23312f] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
      aria-label="SalimSpend dashboard"
    >
      <aside className="flex flex-col border-r border-[#e5e2da] bg-[#f2f0ea] px-[18px] pb-6 pt-[34px] max-[680px]:block max-[680px]:border-b max-[680px]:border-r-0 max-[680px]:px-[18px] max-[680px]:pb-0 max-[680px]:pt-4">
        <div className="px-3 pb-[34px] max-[680px]:flex max-[680px]:items-baseline max-[680px]:justify-between max-[680px]:px-0 max-[680px]:pb-[14px]">
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b8d83]">
            Workspace
          </span>
          <span className="mt-2 block font-serif text-[17px] text-[#263d39] max-[680px]:mt-0 max-[680px]:text-sm">
            September 2026
          </span>
        </div>
        <nav
          className="grid gap-[5px] max-[680px]:flex max-[680px]:gap-1 max-[680px]:overflow-x-auto max-[680px]:pb-3"
          aria-label="Primary navigation"
        >
          {navigation.map(([number, label, href], index) => (
            <a
              className={`flex min-h-[42px] items-center gap-[11px] rounded-[7px] px-3 text-[13px] font-bold no-underline transition hover:translate-x-0.5 hover:bg-[#dfeae4] hover:text-[#0f766e] max-[680px]:min-h-[34px] max-[680px]:shrink-0 max-[680px]:px-[9px] max-[680px]:text-[11px] ${index === 0 ? "bg-[#dfeae4] text-[#0f766e]" : "text-[#69736e]"}`}
              href={href}
              key={label}
            >
              <span
                className={`w-6 font-mono text-[10px] ${index === 0 ? "text-[#0f766e]" : "text-[#9da59e]"}`}
              >
                {number}
              </span>
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex items-start gap-[9px] border-t border-[#dedbd2] px-3 py-[14px] text-xs leading-[1.45] text-[#7e867f] max-[680px]:hidden">
          <span className="mt-1 h-[7px] w-[7px] shrink-0 rounded-full bg-[#e5a644] shadow-[0_0_0_4px_rgba(229,166,68,0.15)]"></span>
          <p className="max-w-[120px]">Everything looks steady this month.</p>
        </div>
      </aside>

      <div
        className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7"
        id="dashboard"
      >
        <header className="mb-[30px] flex items-start justify-between gap-6 max-[680px]:mb-6 max-[680px]:block">
          <div>
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
              Monday, September 23, 2026
            </p>
            <h1 className="my-2 font-serif text-[clamp(32px,4vw,48px)] font-normal leading-[1.03] text-[#213b36]">
              Good morning, Salim.
            </h1>
            <p className="text-sm text-[#7b8580]">
              Here is the shape of your money this month.
            </p>
          </div>
          <button
            className="mt-0 flex min-h-[38px] items-center gap-[18px] whitespace-nowrap rounded-[5px] border border-[#dcded7] bg-[#fffefa] px-3 text-xs text-[#50615b] transition hover:border-[#0f766e] hover:text-[#0f766e] max-[680px]:mt-[18px]"
            type="button"
          >
            This month <span aria-hidden="true">⌄</span>
          </button>
        </header>

        <div className="mb-[14px] grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[680px]:gap-2">
          {summaryCards.map((card) => (
            <article
              className={`relative min-h-[126px] overflow-hidden rounded-[7px] border border-[#e2e2db] bg-[#fffefa] p-[18px] pb-4 max-[680px]:min-h-[116px] max-[680px]:p-[14px] ${toneClasses[card.tone]}`}
              key={card.label}
            >
              <span className="pointer-events-none absolute -bottom-10 -right-6 h-24 w-24 rounded-full border border-current opacity-10"></span>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#89918b]">
                <span>{card.label}</span>
                <span className="h-1 w-[22px] rounded-full bg-current opacity-70"></span>
              </div>
              <strong className="mt-4 block font-serif text-[25px] font-normal tracking-[-0.01em] text-[#253b37] max-[680px]:text-xl">
                {card.value}
              </strong>
              <span className="mt-[7px] block text-[11px] font-bold text-[#0f766e]">
                {card.detail}
              </span>
            </article>
          ))}
        </div>

        <div className="mb-[14px] grid grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)] gap-[14px] max-[980px]:grid-cols-1">
          <article className="rounded-[7px] border border-[#e2e2db] bg-[#fffefa] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
                  Cash flow
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[#243b36]">
                  Income vs expenses
                </h2>
              </div>
              <span className="text-[11px] text-[#9a9c93]">Last 6 months</span>
            </div>
            <div className="mt-3 flex justify-end gap-4 text-[11px] text-[#89918b] max-[680px]:justify-start">
              <span className="inline-flex items-center gap-[5px]">
                <i className="h-[7px] w-[7px] rounded-full bg-[#0f766e]"></i>
                Income
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <i className="h-[7px] w-[7px] rounded-full bg-[#e7b05c]"></i>
                Expenses
              </span>
            </div>
            <div
              className="mt-[18px] flex h-[204px]"
              aria-label="Bar chart comparing income and expenses from April to September"
            >
              <div className="flex w-[29px] flex-col justify-between pb-[23px] pt-1 font-mono text-[9px] text-[#adb2aa]">
                <span>₱8k</span>
                <span>₱6k</span>
                <span>₱4k</span>
                <span>₱2k</span>
                <span>₱0</span>
              </div>
              <div className="relative grid min-w-0 flex-1 grid-cols-6 gap-[10px] border-b border-[#e4e5df]">
                <div className="pointer-events-none absolute inset-x-0 bottom-[23px] top-0 flex flex-col justify-between">
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                </div>
                {cashFlow.map((month) => (
                  <div
                    className="relative z-10 flex min-w-0 flex-col justify-end"
                    key={month.month}
                  >
                    <div className="flex h-[calc(100%-23px)] items-end justify-center gap-[3px]">
                      <span
                        className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[#0f766e]"
                        style={{ height: `${month.income}%` }}
                      ></span>
                      <span
                        className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[#e7b05c]"
                        style={{ height: `${month.expenses}%` }}
                      ></span>
                    </div>
                    <span className="block pt-2 text-center font-mono text-[9px] text-[#9a9d95]">
                      {month.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[7px] border border-[#e2e2db] bg-[#fffefa] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
                  Spending breakdown
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[#243b36]">
                  Where it goes
                </h2>
              </div>
              <button
                className="h-[26px] w-[30px] rounded-[5px] border border-[#dcded7] bg-[#fffefa] text-xs tracking-[2px] text-[#50615b] hover:border-[#0f766e] hover:text-[#0f766e]"
                type="button"
                aria-label="View spending details"
              >
                ...
              </button>
            </div>
            <div className="grid gap-4 py-4">
              <div
                className="mx-auto grid h-[138px] w-[138px] place-items-center rounded-full"
                style={{
                  background:
                    "conic-gradient(#0f766e 0 34%, #f59e0b 34% 56%, #3b82f6 56% 70%, #e879a8 70% 82%, #e9e8e0 82% 100%)",
                }}
                aria-label="Spending breakdown: Home 34 percent, Food 22 percent, Transport 14 percent, Lifestyle 12 percent"
              >
                <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[#fffefa] max-[680px]:h-[78px] max-[680px]:w-[78px]">
                  <strong className="font-serif text-xl font-normal text-[#243b36] max-[680px]:text-[17px]">
                    ₱3,290
                  </strong>
                  <span className="-mt-5 text-[10px] text-[#9a9d95]">
                    spent
                  </span>
                </div>
              </div>
              <div className="grid gap-3">
                {spendingCategories.map((category) => (
                  <div
                    className="flex items-center justify-between gap-3 text-[10px] text-[#9a9d95]"
                    key={category.label}
                  >
                    <span className="flex min-w-0 items-center gap-[7px] text-[#64716b]">
                      <i
                        className="inline-block h-[7px] w-[7px] rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></i>
                      {category.label}
                    </span>
                    <strong className="text-right text-[11px] text-[#42534d]">
                      {category.percent}%
                    </strong>
                    <span>{category.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <a
              className="text-[11px] font-extrabold text-[#0f766e] no-underline hover:text-[#115e59] hover:underline"
              href="#reports"
            >
              View full report <span aria-hidden="true">→</span>
            </a>
          </article>
        </div>

        <article
          className="rounded-[7px] border border-[#e2e2db] bg-[#fffefa] p-[22px] pb-5 max-[680px]:p-[18px] max-[680px]:pb-4"
          id="transactions"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
                Activity
              </p>
              <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[#243b36]">
                Recent transactions
              </h2>
            </div>
            <a
              className="text-[11px] font-extrabold text-[#0f766e] no-underline hover:text-[#115e59] hover:underline"
              href="#transactions"
            >
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-[15px]">
            {transactions.map((transaction) => (
              <div
                className="grid min-h-[60px] grid-cols-[34px_minmax(160px,1fr)_minmax(110px,0.5fr)_auto] items-center gap-3 border-t border-[#efeee8] max-[680px]:grid-cols-[30px_minmax(0,1fr)_auto] max-[680px]:gap-[9px] max-[680px]:min-h-16"
                key={`${transaction.merchant}-${transaction.date}`}
              >
                <div
                  className={`grid h-[30px] w-[30px] place-items-center rounded-[5px] font-serif text-sm font-bold ${avatarClasses[transaction.color]}`}
                >
                  {transaction.glyph}
                </div>
                <div className="grid gap-[3px]">
                  <strong className="text-xs text-[#3a4a45]">
                    {transaction.merchant}
                  </strong>
                  <span className="text-[10px] text-[#a0a49d]">
                    {transaction.category}
                  </span>
                </div>
                <time className="text-right text-[10px] text-[#a0a49d] max-[680px]:hidden">
                  {transaction.date}
                </time>
                <strong
                  className={`text-right text-xs ${transaction.amount.startsWith("+") ? "text-[#0f766e]" : "text-[#5e6863]"}`}
                >
                  {transaction.amount}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function App() {
  const { isLoaded } = useAuth();

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
      <header className="flex min-h-[72px] items-center justify-between border-b border-[#e5e2da] bg-[#fffefa] px-8 max-[720px]:min-h-0 max-[720px]:flex-wrap max-[720px]:gap-4 max-[720px]:px-5 max-[720px]:py-[18px]">
        <a className="text-lg font-bold text-[#213b36] no-underline" href="/">
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
                className="min-h-[38px] cursor-pointer rounded-[6px] border border-[#dcded7] bg-[#fffefa] px-4 text-[15px] leading-none text-[#213b36] transition hover:border-[#0f766e] hover:bg-[#dfeae4] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="min-h-[38px] cursor-pointer rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-[15px] font-bold leading-none text-white transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2"
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <SignOutButton>
              <button
                type="button"
                className="min-h-[38px] cursor-pointer rounded-[6px] border border-[#dcded7] bg-[#fffefa] px-4 text-[15px] leading-none text-[#213b36] transition hover:border-[#0f766e] hover:bg-[#dfeae4] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2"
              >
                Sign out
              </button>
            </SignOutButton>
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        <Show when="signed-out">
          <section className="grid min-h-[calc(100svh-73px)] grid-cols-2 bg-[#f4f6f3] text-left max-[760px]:grid-cols-1">
            <div className="flex flex-col items-center justify-center bg-[#e5efe9] px-10 py-14 text-center max-[760px]:min-h-[280px] max-[560px]:px-6 max-[560px]:py-10">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">
                Welcome back
              </p>
              <h1 className="mt-4 max-w-[340px] font-serif text-[clamp(36px,4vw,54px)] font-normal leading-[1.02] text-[#213b36]">
                Your money, in one clear place.
              </h1>
              <div
                className="mt-8 grid h-20 w-20 place-items-center rounded-full border-8 border-[#b8d1ae] bg-[#fffefa] font-serif text-2xl text-[#0f766e] shadow-[0_10px_18px_rgba(15,118,110,0.14)]"
                aria-hidden="true"
              >
                S
              </div>
            </div>
            <div className="flex items-center justify-center px-10 py-14 max-[760px]:px-6 max-[760px]:py-10">
              <div className="w-full max-w-[390px]">
                <div className="mb-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">
                    SalimSpend
                  </p>
                  <h2 className="mt-2 font-serif text-[28px] font-normal text-[#213b36]">
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
          <Dashboard />
        </Show>
      </main>
    </>
  );
}

export default App;
