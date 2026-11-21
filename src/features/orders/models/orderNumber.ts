/** A readable order number: the last 6 characters of the id. */
export const orderNumber = (id: string) => `#${id.slice(-6).toUpperCase()}`;
