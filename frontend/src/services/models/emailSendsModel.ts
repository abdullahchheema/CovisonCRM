import { ApiCore } from "../utilities/core";

export const apiEmailSends = new ApiCore({
  getAll: true,
  getByParams: true,
  post: true,
  remove: true,
  url: "email-sends",
});
