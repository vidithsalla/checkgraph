export type ActionResult = {
  status: "idle" | "error";
  message?: string;
};

export const idleActionResult: ActionResult = {
  status: "idle",
};

export class ActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionValidationError";
  }
}
