export const MESSAGE_HANDLERS = Symbol('messageHandlers');

function Receive(messageType: string) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor[MESSAGE_HANDLERS]) {
      target.constructor[MESSAGE_HANDLERS] = new Map<string, string>();
    }
    target.constructor[MESSAGE_HANDLERS].set(messageType, propertyKey);
  };
}

function getMessageHandlers(actorClass: any): Map<string, string> {
  return actorClass?.[MESSAGE_HANDLERS] || new Map();
}

export { Receive, getMessageHandlers };
