/**
 * 文字列の配列の中で、空でない最初の要素を返す。
 */
export const fallback = (
  ...args: Array<string | undefined>
): string | undefined => {
  for (const x of args) {
    if (x !== undefined && x !== '') {
      return x;
    }
  }
};
