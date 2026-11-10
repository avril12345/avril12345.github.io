/** Edit mode exists only under `next dev`. In production builds this is the constant `false`. */
export const EDIT_MODE = process.env.NODE_ENV === "development";
