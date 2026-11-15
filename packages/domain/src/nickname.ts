export const MAX_NICKNAME_LENGTH = 16;

export const parseNickname = (raw: string) => {
  const nickname = raw.trim();
  return nickname.length > 0 && [...nickname].length <= MAX_NICKNAME_LENGTH
    ? nickname
    : undefined;
};
