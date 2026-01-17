export function normalizeMathDelimiters(value: string) {
  return value.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$").replace(/\\\(/g, "$").replace(/\\\)/g, "$");
}
