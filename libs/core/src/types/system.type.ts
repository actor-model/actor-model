type Message = any;
type Behavior = (message: Message) => void | Promise<void>;


export type { Message, Behavior };