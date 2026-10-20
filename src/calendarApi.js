import axios from "axios";
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://confirmation-sk25.onrender.com/api/",
});
export const getCalendar = (month, year) =>
  api.get("/calendar", { params: { month, year } }).then((r) => r.data);
export const getDate = (date) =>
  api.get(`/calendar/${date}`).then((r) => r.data);
export const create = (data) => api.post("/calendar", data).then((r) => r.data);
export const update = (date, data) =>
  api.put(`/calendar/${date}`, data).then((r) => r.data);
export const registerVisit = (data) => api.post('/visits', data).then((r) => r.data);
