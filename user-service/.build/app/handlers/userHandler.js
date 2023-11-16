"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProfile = exports.EditProfile = exports.CreateProfile = exports.Verify = exports.GetVerificationCode = exports.Login = exports.Signup = void 0;
const userService_1 = require("../service/userService");
const core_1 = __importDefault(require("@middy/core"));
const http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
const userRepository_1 = require("../repository/userRepository");
const service = new userService_1.UserService(new userRepository_1.UserRepository());
exports.Signup = (0, core_1.default)((event) => {
    return service.CreateUser(event);
}).use((0, http_json_body_parser_1.default)());
exports.Login = (0, core_1.default)((event) => {
    return service.UserLogin(event);
}).use((0, http_json_body_parser_1.default)());
exports.GetVerificationCode = (0, core_1.default)((event) => {
    return service.GetVerificationToken(event);
}).use((0, http_json_body_parser_1.default)());
exports.Verify = (0, core_1.default)((event) => {
    return service.VerifyUser(event);
}).use((0, http_json_body_parser_1.default)());
exports.CreateProfile = (0, core_1.default)((event) => {
    return service.CreateProfile(event);
}).use((0, http_json_body_parser_1.default)());
exports.EditProfile = (0, core_1.default)((event) => {
    return service.EditProfile(event);
}).use((0, http_json_body_parser_1.default)());
exports.GetProfile = (0, core_1.default)((event) => {
    return service.GetProfile(event);
}).use((0, http_json_body_parser_1.default)());
//# sourceMappingURL=userHandler.js.map