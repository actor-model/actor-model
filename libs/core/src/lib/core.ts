
type Message = any;
type Behavior = (message: Message) => void | Promise<void>;

class Actor {
  private mailbox: Message[] = [];
  private processing = false;

  constructor(private behavior: Behavior) {}

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

class ActorSystem {
  private actors = new Map<string, Actor>();

  spawn(name: string, behavior: Behavior): Actor {
    const actor = new Actor(behavior);
    this.actors.set(name, actor);
    return actor;
  }

  send(actorName: string, message: Message): void {
    const actor = this.actors.get(actorName);
    if (actor) {
      actor.send(message);
    } else {
      console.error(`Actor ${actorName} not found`);
    }
  }
}


export { Actor, ActorSystem };