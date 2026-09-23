# SalimSpend — Product Specification

## 1. Product Overview

SalimSpend is a free personal expense tracking and budgeting application
that helps users record their income and expenses, organize transactions
into categories, monitor their spending, and manage their budgets over time.

Users can review their spending by day, week, month and year and see how their money
is being distributed across different categories.

## 2. Target Users

SalimSpend is designed for individuals who want a simple and accessible
way to track their income, expenses, and budgets.

The application should be usable by people with different levels of
financial knowledge and should not require advanced budgeting or
accounting knowledge.

## 3. Product Goals

SalimSpend should:

- Make it easy for users to record their income and expenses.
- Help users understand where their money is being spent.
- Allow users to monitor their spending over time.
- Help users create and track personal budgets.
- Provide clear daily, weekly, monthly and yearly spending summaries.
- Keep the experience simple and accessible for users with different
  levels of financial knowledge.

  ## 4. Authentication

SalimSpend will use Clerk for user authentication and account management.

Users should be able to:

- Sign up for an account.
- Sign in to their account.
- Sign out of their account.
- Access their personal SalimSpend data after authentication.

Each user's financial data must be associated with their authenticated
account so that users can only access their own transactions, budgets,
and financial information.

Authentication should be handled by Clerk rather than implementing
password management and authentication logic from scratch.

SalimSpend will not include payment, subscription, or premium account
features.

## 5. Transactions

Transactions are the primary records used to track a user's income and expenses.

Each transaction should include:

- A transaction type indicating whether it is an income or an expense.
- An amount representing the value of the transaction.
- A category used to organize the transaction.
- A date indicating when the transaction occurred.
- An optional note for additional information.

Users should be able to:

- Add a new transaction.
- Edit an existing transaction.
- Delete an existing transaction.
- View their transactions.
- Distinguish between income and expense transactions.

Each transaction must belong to the authenticated user who created it. Users must only be able to access and manage their own transactions.

The transaction amount must be greater than zero, and a transaction must have a valid type, category, and date.

## 6. Categories

Categories are used to organize and group transactions.

SalimSpend should provide default categories that users can use when recording transactions.

Users should be able to:

- Select a category when creating a transaction.
- Change the category when editing a transaction.
- Create their own custom categories.
- Use categories to organize and understand their income and expenses.

Categories should support the organization of transactions and allow spending and income to be summarized by category.

Custom categories created by a user should belong to that authenticated user and should not be accessible to other users.

## 7. Budgeting

SalimSpend should allow users to create and manage personal spending budgets.

Users should be able to:

- Create a budget for a category.
- Set the amount available for the budget.
- Choose a budget period.
- View how much has been spent against the budget.
- View the remaining amount of the budget.
- Edit an existing budget.
- Delete an existing budget.

Users should be able to choose from the following budget periods:

- Daily
- Weekly
- Monthly
- Yearly

Budgets should be associated with a category so users can monitor spending in specific areas.

The application should compare relevant expenses against the selected budget period and clearly show the user's spending progress.

Each budget must belong to the authenticated user who created it. Users must only be able to access and manage their own budgets.

## 8. Dashboard

The SalimSpend dashboard should provide users with a clear overview of their financial activity.

The dashboard should display:

- Current balance.
- Total income.
- Total expenses.
- Recent transactions.
- Budget progress.

The dashboard should use **the current month as the default time period** for financial summaries.

Users should be able to change the selected time period to review their financial information for different periods.

Dashboard information should be based only on the authenticated user's transactions and budgets.

## 9. Reports & Spending Insights

SalimSpend should provide users with summaries that help them understand their financial activity and spending patterns over time.

Users should be able to:

- View a monthly financial summary.
- View a yearly financial summary.
- Review total income and expenses for a selected period.
- View spending grouped by category.
- Review how their spending is distributed across different categories.
- Navigate between different days, weeks, months and years.

Reports should use the authenticated user's financial data and should only include transactions belonging to that user.

The reports should present financial information in a clear and understandable way without requiring advanced financial or accounting knowledge.

## 10. Data & User Ownership

SalimSpend should keep each user's financial data separate from other users.

The following data should belong to the authenticated user who created it:

- Transactions.
- Custom categories.
- Budgets.
- Other personal financial information stored by SalimSpend.

Users should only be able to view, create, edit, and delete their own financial data.

Users must not be able to access or manage another user's transactions, categories, budgets, or other personal financial information.

User authentication should determine which financial data belongs to the current user.

Data ownership and access rules should apply consistently across all SalimSpend features.

## 11. MVP Scope

The first version of SalimSpend should focus on providing a simple and complete personal expense tracking and budgeting experience.

### In MVP

The MVP should include:

- User authentication.
- Income and expense transactions.
- Transaction editing and deletion.
- Default and custom categories.
- Daily, weekly, monthly, and yearly budgets.
- A financial dashboard.
- Monthly and yearly financial summaries.
- Spending breakdowns by category.
- User-specific data ownership and access control.

These features should provide the core workflow of:

**Record → Organize → Understand → Manage**

### Out of MVP

The following features are considered future possibilities and should not be included in the initial MVP unless intentionally approved as a scope change:

- Recurring transactions.
- Multiple wallets or financial accounts.
- Advanced financial analytics.
- Notifications and reminders.
- Data export and import.
- AI-powered financial insights.
- Advanced charting and visualization.
- Other features that are not required for the core personal expense tracking and budgeting experience.

Features outside the MVP should not be implemented simply because they are technically possible or suggested during development. Adding them should require an intentional, human-reviewed scope decision.
