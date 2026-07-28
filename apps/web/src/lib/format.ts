const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCategory(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}
