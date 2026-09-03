export type TypedDialogueEvaluation = {
  accepted: boolean;
  score: number;
  feedback: string;
};

export function normalizeChineseResponse(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{Script=Han}\p{Letter}\p{Number}]/gu, "");
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0) as number[];

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    for (let index = 0; index <= right.length; index += 1) previous[index] = current[index];
  }

  return previous[right.length];
}

export function evaluateTypedDialogueResponse(input: string, expected: string): TypedDialogueEvaluation {
  const normalizedInput = normalizeChineseResponse(input);
  const normalizedExpected = normalizeChineseResponse(expected);

  if (!normalizedInput) {
    return { accepted: false, score: 0, feedback: "Hãy nhập một câu trả lời bằng tiếng Trung." };
  }

  const longest = Math.max(normalizedInput.length, normalizedExpected.length, 1);
  const score = Math.max(0, Math.round((1 - editDistance(normalizedInput, normalizedExpected) / longest) * 100));

  if (score >= 88) return { accepted: true, score, feedback: "Rất tốt — câu trả lời đúng và tự nhiên." };
  if (score >= 72) return { accepted: true, score, feedback: "Đúng ý rồi. Xem câu mẫu để nói gọn và tự nhiên hơn." };
  if (score >= 45) return { accepted: false, score, feedback: "Bạn đã gần đúng. Hãy chỉnh lại vài từ theo câu mẫu bên dưới." };
  return { accepted: false, score, feedback: "Câu này chưa khớp tình huống. Hãy nghe lại và thử theo gợi ý." };
}
