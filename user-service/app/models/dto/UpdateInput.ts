import { Length } from "class-validator";

export class VerificationInput {
  @Length(4)
  code: string;
}
