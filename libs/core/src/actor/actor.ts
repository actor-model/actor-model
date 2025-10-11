import {
  MailboxOptions,
  Mailbox,
  ActorState,
  Message,
  ActorSystem,
} from '@actor-model/core';
import { getMessageHandlers } from '../decorators';
import { EventEmitter } from 'node:events';

export class Actor extends EventEmitter {
  protected children = new Map<string, Actor>();
  protected parent?: Actor;
  protected system?: ActorSystem;
  protected state: ActorState = ActorState.CREATED;
  protected mailbox: Mailbox;

  constructor(
    protected name: string,
    parent?: Actor,
    mailboxOptions?: MailboxOptions
  ) {
    super();
    this.parent = parent;
    this.mailbox = new Mailbox(this._receive.bind(this), mailboxOptions);
    this.on('message', this._receive.bind(this));
  }

  _receive(message: Message): void {
    const handlers = getMessageHandlers(this.constructor);
    const handlerMethod = handlers.get(message.type);

    if (handlerMethod && typeof (this as any)[handlerMethod] === 'function') {
      (this as any)[handlerMethod](message);
    } else if (this.receive && typeof this.receive === 'function') {
      this.receive(message);
    } else {
      this.handleUnknownMessage(message);
    }
  }

  protected receive?(message: Message): void;

  protected handleUnknownMessage(message: Message): void {
    console.log(
      `[${this.getFullPath()}] Unknown message type: ${message.type}`
    );
  }

  send(message: Message): void {
    if (this.state !== ActorState.STARTED) {
      console.warn(
        `[${this.getFullPath()}] Cannot send message, actor is ${this.state}`
      );
      return;
    }

    const queued = this.mailbox.enqueue(message);
    if (!queued) {
      console.error(
        `[${this.getFullPath()}] Failed to queue message: ${message.type}`
      );
    }
  }

  protected onStart(): void {
    // Override in subclasses for custom start logic
  }

  protected onStop(): void {
    // Override in subclasses for custom stop logic
  }

  protected onRestart(): void {
    // Override in subclasses for custom restart logic
  }

  start(): void {
    if (
      this.state !== ActorState.CREATED &&
      this.state !== ActorState.STOPPED
    ) {
      console.warn(
        `[${this.getFullPath()}] Cannot start actor from state: ${this.state}`
      );
      return;
    }

    this.state = ActorState.STARTING;
    console.log(`[${this.getFullPath()}] Starting actor...`);

    try {
      this.onStart();
      this.state = ActorState.STARTED;
      console.log(`[${this.getFullPath()}] Actor started`);
      this.emit('lifecycle', { type: 'started', actor: this });
    } catch (error) {
      console.error(`[${this.getFullPath()}] Failed to start actor:`, error);
      this.state = ActorState.STOPPED;
    }
  }

  stop(): void {
    if (this.state !== ActorState.STARTED) {
      console.warn(
        `[${this.getFullPath()}] Cannot stop actor from state: ${this.state}`
      );
      return;
    }

    this.state = ActorState.STOPPING;
    console.log(`[${this.getFullPath()}] Stopping actor...`);

    try {
      // Stop all children first
      for (const child of this.children.values()) {
        child.stop();
      }

      this.onStop();
      this.state = ActorState.STOPPED;
      console.log(`[${this.getFullPath()}] Actor stopped`);
      this.emit('lifecycle', { type: 'stopped', actor: this });
    } catch (error) {
      console.error(`[${this.getFullPath()}] Error during stop:`, error);
      this.state = ActorState.STOPPED;
    }
  }

  restart(): void {
    if (this.state !== ActorState.STARTED) {
      console.warn(
        `[${this.getFullPath()}] Cannot restart actor from state: ${this.state}`
      );
      return;
    }

    this.state = ActorState.RESTARTING;
    console.log(`[${this.getFullPath()}] Restarting actor...`);

    try {
      this.onStop();
      this.onRestart();
      this.onStart();
      this.state = ActorState.STARTED;
      console.log(`[${this.getFullPath()}] Actor restarted`);
      this.emit('lifecycle', { type: 'restarted', actor: this });
    } catch (error) {
      console.error(`[${this.getFullPath()}] Failed to restart actor:`, error);
      this.state = ActorState.STOPPED;
    }
  }

  getState(): ActorState {
    return this.state;
  }

  getName(): string {
    return this.name;
  }

  getFullPath(): string {
    if (this.parent) {
      return `${this.parent.getFullPath()}/${this.name}`;
    }
    return this.name;
  }

  createChild<T extends Actor>(
    ActorClass: new (name: string, parent: Actor) => T,
    name: string
  ): T {
    const childActor = new ActorClass(name, this);
    childActor.system = this.system;
    this.children.set(name, childActor);

    if (this.system) {
      this.system.register(childActor);
    }

    return childActor;
  }

  getChild(name: string): Actor | undefined {
    return this.children.get(name);
  }

  getChildren(): Actor[] {
    return Array.from(this.children.values());
  }

  getParent(): Actor | undefined {
    return this.parent;
  }

  setSystem(system: ActorSystem): void {
    this.system = system;
    for (const child of this.children.values()) {
      child.setSystem(system);
    }
  }
}
