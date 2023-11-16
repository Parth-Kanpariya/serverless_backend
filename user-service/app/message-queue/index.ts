import axios from "axios";

const PRODUCT_SERVICE_URL =
  "https://9i7el9cmxk.execute-api.ap-southeast-2.amazonaws.com/prod/products-queue"; //"http://127.0.0.1:3000/products-queue/";
// it will be come from process.env (or AWS secret manager)

export const PullData = async (requestData: Record<string, unknown>) => {
  return axios.post(PRODUCT_SERVICE_URL, requestData);
};
