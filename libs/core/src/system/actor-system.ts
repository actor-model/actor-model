import { Actor, Message } from '@actor-model/core';

class ActorSystem {
  private readonly actors = new Map<string, Actor>();

  register(actor: Actor): void {
    const fullPath = actor.getFullPath();
    this.actors.set(fullPath, actor);
    actor.setSystem(this);
    actor.start();
  }

  unregister(actorName: string): void {
    this.actors.delete(actorName);
  }

  getActor(name: string): Actor | undefined {
    return this.actors.get(name);
  }

  getActorByPath(path: string): Actor | undefined {
    return this.actors.get(path);
  }

  sendToPath(path: string, message: Message): boolean {
    const actor = this.getActorByPath(path);
    if (actor) {
      actor.send(message);
      return true;
    }
    console.warn(`Actor not found at path: ${path}`);
    return false;
  }

  getAllActors(): Actor[] {
    return Array.from(this.actors.values());
  }

  getRootActors(): Actor[] {
    return Array.from(this.actors.values()).filter(
      (actor) => !actor.getParent()
    );
  }

  printHierarchy(): void {
    const rootActors = this.getRootActors();
    console.log('Actor Hierarchy:');
    for (const actor of rootActors) {
      this.printActorTree(actor, 0);
    }
  }

  private printActorTree(actor: Actor, indent: number): void {
    const prefix = '  '.repeat(indent);
    console.log(
      `${prefix}- ${actor.getName()} (${actor.getFullPath()}) [${actor.getState()}]`
    );

    for (const child of actor.getChildren()) {
      this.printActorTree(child, indent + 1);
    }
  }

  stopAllActors(): void {
    console.log('Stopping all actors...');
    for (const actor of this.actors.values()) {
      if (actor.getState() === 'started') {
        actor.stop();
      }
    }
  }

  shutdown(): void {
    this.stopAllActors();
    this.actors.clear();
  }

  size(): number {
    return this.actors.size;
  }
}

export { ActorSystem };
