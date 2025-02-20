import { UserService } from "../service/userService";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import middy from "@middy/core";
import bodyParser from "@middy/http-json-body-parser";
import { UserRepository } from "../repository/userRepository";

const service = new UserService(new UserRepository());

export const Signup = middy((event: APIGatewayProxyEventV2) => {
  return service.CreateUser(event);
}).use(bodyParser());

export const Login = middy((event: APIGatewayProxyEventV2) => {
  return service.UserLogin(event);
}).use(bodyParser());

export const GetVerificationCode = middy((event: APIGatewayProxyEventV2) => {
  return service.GetVerificationToken(event);
}).use(bodyParser());

export const Verify = middy((event: APIGatewayProxyEventV2) => {
  return service.VerifyUser(event);
}).use(bodyParser());

export const CreateProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.CreateProfile(event);
}).use(bodyParser());

export const EditProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.EditProfile(event);
}).use(bodyParser());

export const GetProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.GetProfile(event);
}).use(bodyParser());
