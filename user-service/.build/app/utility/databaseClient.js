"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClient = void 0;
const pg_1 = require("pg");
const DBClient = () => {
    return new pg_1.Client({
        host: "127.0.0.1",
        user: "root",
        database: "user_service",
        password: "root",
        port: 5432,
    });
};
exports.DBClient = DBClient;
// local
// host: "127.0.0.1",
// user: "root",
// database: "user_service",
// password: "root",
// port: 5432,
// SELF managed RDS (postgres)
// host: "ec2-13-238-200-146.ap-southeast-2.compute.amazonaws.com",
// user: "user_service",
// database: "user_service",
// password: "user_service#2023",
// port: 5432,
// AWS managed RDS (postgres)
//# sourceMappingURL=databaseClient.js.map