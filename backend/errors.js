export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new AppError(message, status);
}
export function validPeriod(start, end, future = true) {
  const a = new Date(start),
    b = new Date(end);
  requireValue(
    Number.isFinite(+a) && Number.isFinite(+b) && b > a,
    "O fim deve ser posterior ao início.",
  );
  if (future) requireValue(a > new Date(), "Escolha um início no futuro.");
}
