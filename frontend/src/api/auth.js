import api from "./client";

export const authLogin    = (email, password)              => api.post("/api/auth/login",    { email, password });
export const authRegister = (username, email, password)    => api.post("/api/auth/register", { username, email, password });
export const authMe       = ()                             => api.get("/api/auth/me");
