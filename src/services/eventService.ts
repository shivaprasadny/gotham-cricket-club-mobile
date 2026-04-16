import api from "../api/axiosConfig";

// Get all events
export const getEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};

// Create new event
export const createEvent = async (payload: {
  title: string;
  description: string;
  eventDate: string;
  location: string;
}) => {
  const response = await api.post("/events", payload);
  return response.data;
};

// Submit event availability
export const submitEventAvailability = async (
  eventId: number,
  payload: {
    status: "GOING" | "NOT_GOING" | "MAYBE";
    message?: string;
  }
) => {
  const response = await api.put(`/events/${eventId}/availability`, payload);
  return response.data;
};

// Get all event responses
export const getEventAvailability = async (eventId: number) => {
  const response = await api.get(`/events/${eventId}/availability`);
  return response.data;
};