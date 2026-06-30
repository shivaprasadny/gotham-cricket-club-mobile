import api from "../api/axiosConfig";
import {
  CreatePollRequest,
  PollResponse,
  UpdatePollDeadlineRequest,
  VotePollRequest,
} from "../types/poll";

export const getActivePolls = (): Promise<PollResponse[]> =>
  api.get("/polls/active").then((r) => r.data);

export const getClosedPolls = (): Promise<PollResponse[]> =>
  api.get("/polls/closed").then((r) => r.data);

export const getMyPolls = (): Promise<PollResponse[]> =>
  api.get("/polls/my").then((r) => r.data);

export const getPoll = (pollId: number): Promise<PollResponse> =>
  api.get(`/polls/${pollId}`).then((r) => r.data);

export const createPoll = (data: CreatePollRequest): Promise<PollResponse> =>
  api.post("/polls", data).then((r) => r.data);

export const votePoll = (pollId: number, data: VotePollRequest): Promise<PollResponse> =>
  api.post(`/polls/${pollId}/vote`, data).then((r) => r.data);

export const closePoll = (pollId: number): Promise<PollResponse> =>
  api.post(`/polls/${pollId}/close`).then((r) => r.data);

export const updatePollDeadline = (
  pollId: number,
  data: UpdatePollDeadlineRequest
): Promise<PollResponse> =>
  api.patch(`/polls/${pollId}/deadline`, data).then((r) => r.data);

export const deletePoll = (pollId: number): Promise<void> =>
  api.delete(`/polls/${pollId}`).then(() => undefined);
