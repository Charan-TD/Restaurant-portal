export function errorMessage(error: unknown): string {
  // Errors returned by RTK Query already carry a readable message.
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  )
    return error.message;
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
