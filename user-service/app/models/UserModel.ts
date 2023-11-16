import { AddressModel } from "./AddressModel";

export interface UserModel {
  user_id?: number;
  email: string;
  password: string;
  phone: string;
  salt: string;
  user_type: "BUYER" | "SELLER";
  first_name?: string;
  lastname?: string;
  profile_pic?: string;
  verification_code?: number;
  expiry?: string;
  address?: AddressModel[];
  stripe_id?: string;
  payment_id?: string;
}
