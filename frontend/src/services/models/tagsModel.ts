import { ApiCore } from "../utilities/core";

export const apiTags = new ApiCore({
  getAll: true,
  post: true,
  putById: true,
  remove: true,
  url: "tags",
});
