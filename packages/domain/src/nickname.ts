export const MAX_NICKNAME_LENGTH = 16;

export const nicknameProblem = (
  trimmed: string,
  bowlers: readonly { nickname: string }[],
) => {
  if (trimmed.length === 0 || [...trimmed].length > MAX_NICKNAME_LENGTH) {
    return "NICKNAME_INVALID";
  }
  const key = trimmed.toLocaleLowerCase();
  return bowlers.some((b) => b.nickname.toLocaleLowerCase() === key)
    ? "NICKNAME_TAKEN"
    : undefined;
};
