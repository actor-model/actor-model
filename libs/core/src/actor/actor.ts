import { Behavior, Message } from '@actor-model/core';

class Actor {
  private readonly mailbox: Message[] = [];
  private processing = false;

  constructor(private readonly behavior: Behavior) {}

  async send(message: Message): Promise<void> {
    this.mailbox.push(message);
    if (!this.processing) {
      this.processing = true;
      while (this.mailbox.length > 0) {
        const msg = this.mailbox.shift()!;
        await this.behavior(msg);
      }
      this.processing = false;
    }
  }
}

export { Actor };