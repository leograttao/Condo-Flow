// Chain of Responsibility: cada etapa valida e passa para a próxima.
export class Handler {
  constructor() {
    this.next = null;
  }
  setNext(handler) {
    this.next = handler;
    return handler;
  }
  async handle(context) {
    await this.validate(context);
    if (this.next) await this.next.handle(context);
  }
  async validate() {}
}
export function chain(...handlers) {
  handlers.reduce((previous, current) => previous.setNext(current));
  return handlers[0];
}
