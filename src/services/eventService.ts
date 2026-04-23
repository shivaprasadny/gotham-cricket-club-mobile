import api from "../api/axiosConfig";

export const getEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};

export const createEvent = async (payload: {
  title: string;
  description: string;
  location: string;
  eventDate: string;
}) => {
  const response = await api.post("/events", payload);
  return response.data;
};

export const updateEvent = async (
  eventId: number,
  payload: {
    title: string;
    description: string;
    location: string;
    eventDate: string;
  }
) => {
  const response = await api.put(`/events/${eventId}`, payload);
  return response.data;
};

export const deleteEvent = async (eventId: number) => {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
};

export const getEventAvailability = async (eventId: number) => {
  const response = await api.get(`/events/${eventId}/availability`);
  return response.data;
};

export const submitEventAvailability = async (
  eventId: number,
  payload: {
    status: "GOING" | "NOT_GOING" | "MAYBE";
    message?: string;
  }
) => {
  const response = await api.post(`/events/${eventId}/availability`, payload);
  return response.data;
};
export const getEventById = async (id: number) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};