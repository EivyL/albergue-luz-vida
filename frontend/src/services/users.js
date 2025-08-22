// src/services/users.js
import api from "../api";

export const getUsers = () => api.get("/usuarios").then(r => r.data);
export const createUser = (payload) => api.post("/usuarios", payload).then(r => r.data);
export const updateUser = (id, payload) => api.put(`/usuarios/${id}`, payload).then(r => r.data);
export const toggleUser = (id) => api.patch(`/usuarios/${id}/estado`).then(r => r.data);
