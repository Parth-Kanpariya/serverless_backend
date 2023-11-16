import { CartService } from "../service/cartService";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import middy from "@middy/core";
import bodyParser from "@middy/http-json-body-parser";
import { CartRepository } from "../repository/cartRepository";

const cartService = new CartService(new CartRepository());

export const CreatePayment = middy((event: APIGatewayProxyEventV2) => {}).use(
  bodyParser()
);
