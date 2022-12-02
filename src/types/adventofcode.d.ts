export type CompletionDay = {
  [key in '1' | '2']: {
    get_star_ts: number;
    star_index: number;
  };
};

export type Member = {
  global_score: number;
  last_star_ts: number;
  stars: number;
  local_score: number;
  name: string;
  id: number;

  completion_day_level: {
    /**
     * Key is in string format, though it is a number relating to the date of the month.
     * e.g.: December 1st is "1", 2nd is "2", and so on.
     */
    [key: string]: CompletionDay;
  };
};

export type PrivateLeaderboard = {
  members: Record<number, Member>;
  owner_id: number;
  event: string;
};
