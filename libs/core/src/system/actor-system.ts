
import { Behavior, Message, Actor } from '@actor-model/core';

class ActorSystem {
  private readonly actors = new Map<string, Actor>();

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

export { ActorSystem };