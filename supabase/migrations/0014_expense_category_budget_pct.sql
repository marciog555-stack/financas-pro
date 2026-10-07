alter table expense_categories rename column monthly_limit to budget_pct;
alter table expense_categories add constraint budget_pct_range check (budget_pct is null or (budget_pct >= 0 and budget_pct <= 100));
