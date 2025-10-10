import { Message, MailboxOptions } from '@actor-model/core';

class Mailbox {
  private messageQueue: Message[] = [];
  private isProcessing = false;
  private maxSize: number;
  private processingDelay: number;

  constructor(
    private messageHandler: (message: Message) => void,
    options: MailboxOptions = {}
  ) {
    this.maxSize = options.maxSize ?? 1000;
    this.processingDelay = options.processingDelay ?? 0;
  }

  enqueue(message: Message): boolean {
    if (this.messageQueue.length >= this.maxSize) {
      console.warn('Mailbox is full, dropping message:', message);
      return false;
    }

    this.messageQueue.push(message);
    this.processNextMessage();
    return true;
  }

  private async processNextMessage(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;

        if (this.processingDelay > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.processingDelay)
          );
        }

        this.messageHandler(message);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clear(): void {
    this.messageQueue = [];
  }

  isEmpty(): boolean {
    return this.messageQueue.length === 0;
  }

  isFull(): boolean {
    return this.messageQueue.length >= this.maxSize;
  }
}

export { Mailbox };
