export type PollStatus = "ACTIVE" | "CLOSED";
export type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
export type PollAudienceType = "CLUB" | "CUSTOM";

export type PollOptionResponse = {
  optionId: number;
  optionText: string;
  displayOrder: number;
  voteCount: number;
  percentage: number;
};

export type PollResponse = {
  pollId: number;
  question: string;
  pollType: PollType;
  audienceType: PollAudienceType;
  status: PollStatus;
  createdBy: string;
  createdAt: string;
  deadlineAt: string | null;
  closedAt: string | null;
  hasVoted: boolean;
  myVotedOptionIds: number[];
  options: PollOptionResponse[];
  totalVoters: number;
  canVote: boolean;
  canClose: boolean;
  canDelete: boolean;
  canEditDeadline: boolean;
};

export type CreatePollRequest = {
  question: string;
  pollType: PollType;
  audienceType: PollAudienceType;
  audienceUserIds?: number[];
  options: string[];
  deadlineAt?: string | null;
};

export type VotePollRequest = {
  optionIds: number[];
};

export type UpdatePollDeadlineRequest = {
  deadlineAt: string | null;
};
