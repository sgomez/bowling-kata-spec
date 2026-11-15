export type RoomCode = string & { readonly __brand: "RoomCode" };

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 5;
const PATTERN = new RegExp(`^[${ALPHABET}]{${LENGTH}}$`);

export const generateRoomCode = (
  isTaken: (code: RoomCode) => boolean,
  random: () => number,
): RoomCode => {
  for (;;) {
    const code = Array.from(
      { length: LENGTH },
      () => ALPHABET[Math.floor(random() * ALPHABET.length)],
    ).join("") as RoomCode;
    if (!isTaken(code)) {
      return code;
    }
  }
};

export const parseRoomCode = (input: string): RoomCode | undefined => {
  const code = input.trim().toUpperCase();
  return PATTERN.test(code) ? (code as RoomCode) : undefined;
};
