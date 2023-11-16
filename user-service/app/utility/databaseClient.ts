import { Client } from "pg";

export const DBClient = () => {
  return new Client({
    host: "127.0.0.1",
    user: "root",
    database: "user_service",
    password: "root",
    port: 5432,
  });
};

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
