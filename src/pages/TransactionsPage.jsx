import SidebarNav from "../components/SidebarNav";

const transactionRows = [
  {
    id: "TX-1047",
    description: "Whole Foods Market",
    amount: "-₱86.24",
    type: "expense",
    category: "Groceries",
    paymentMethod: "Debit Card",
    date: "Sep 23, 2026",
  },
  {
    id: "TX-1046",
    description: "Employer Salary",
    amount: "+₱3,200.00",
    type: "income",
    category: "Salary",
    paymentMethod: "Bank Transfer",
    date: "Sep 22, 2026",
  },
  {
    id: "TX-1045",
    description: "Metro Transit",
    amount: "-₱42.80",
    type: "expense",
    category: "Transport",
    paymentMethod: "Debit Card",
    date: "Sep 17, 2026",
  },
  {
    id: "TX-1044",
    description: "Northstar Studio",
    amount: "+₱1,250.00",
    type: "income",
    category: "Freelance income",
    paymentMethod: "Bank Transfer",
    date: "Sep 10, 2026",
  },
  {
    id: "TX-1043",
    description: "Notion",
    amount: "-₱12.00",
    type: "expense",
    category: "Subscriptions",
    paymentMethod: "Credit Card",
    date: "Sep 09, 2026",
  },
];

export default function TransactionsPage({ currentView, onSelectView }) {
  const hasTransactions = transactionRows.length > 0;

  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[#f8f7f3] text-left text-[#23312f] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
      aria-label="SalimSpend transactions"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Your transaction history is ready to review."
        footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
      />

      <div className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7">
        <header className="mb-[24px] flex items-start justify-between gap-6 max-[680px]:mb-6 max-[680px]:block">
          <div>
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
              Money movement
            </p>
            <h1 className="mt-2 font-serif text-[clamp(32px,4vw,46px)] font-normal leading-[1.03] text-[#213b36]">
              Transactions
            </h1>
            <p className="mt-2 text-sm text-[#7b8580]">
              Review recent spending and income across your financial activity.
            </p>
          </div>
          <button
            className="inline-flex min-h-[42px] items-center justify-center rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2 max-[680px]:mt-[18px]"
            type="button"
          >
            + Add Transaction
          </button>
        </header>

        <div className="rounded-[10px] border border-[#e2e2db] bg-[#fffefa] p-[18px] max-[680px]:p-[14px]">
          <div className="mb-4 flex items-center justify-between gap-3 max-[680px]:block">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b8d83]">
                Overview
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[#243b36]">
                All transactions
              </h2>
            </div>
            <span className="rounded-full border border-[#dfe8e3] bg-[#f1f8f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0f766e]">
              {transactionRows.length} items
            </span>
          </div>

          {!hasTransactions ?
            <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#d7e0dc] bg-[#f8faf8] px-6 py-10 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf6f1] text-[20px] text-[#0f766e]">
                  ↘
                </div>
                <h3 className="font-serif text-[26px] font-normal text-[#213b36]">
                  No transactions yet
                </h3>
                <p className="mt-2 max-w-[340px] text-sm text-[#6d7974]">
                  Add your first income or expense to start tracking your money.
                </p>
              </div>
            </div>
          : <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)] gap-4 border-b border-[#e6e5e0] px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8b8d83]">
                  <span>Description</span>
                  <span>Amount</span>
                  <span>Category</span>
                  <span>Payment</span>
                  <span>Date</span>
                </div>

                {transactionRows.map((transaction) => (
                  <div
                    className="grid grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)] items-center gap-4 border-b border-[#f0efe9] px-3 py-4 text-[12px] text-[#465753] last:border-b-0"
                    key={transaction.id}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-[34px] w-[34px] place-items-center rounded-[7px] font-serif text-sm font-bold ${transaction.type === "income" ? "bg-[#dcece1] text-[#27735f]" : "bg-[#f2e9d5] text-[#a2662d]"}`}
                      >
                        {transaction.type === "income" ? "↗" : "↘"}
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-[#213b36]">
                          {transaction.description}
                        </strong>
                        <span className="text-[10px] text-[#9a9d95]">
                          {transaction.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-semibold ${transaction.type === "income" ? "text-[#0f766e]" : "text-[#5e6863]"}`}
                    >
                      {transaction.amount}
                    </span>
                    <span>{transaction.category}</span>
                    <span>{transaction.paymentMethod}</span>
                    <span className="text-[#75827d]">{transaction.date}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  );
}
