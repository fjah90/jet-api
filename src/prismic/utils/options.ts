export const getIdsFromOptionCode = (optionCode, extras) => {
  for (const extra of extras) {
    for (const option of extra.options) {
      if (option.code === optionCode) {
        return {
          extraId: extra.id,
          optionId: option.id,
        };
      }
    }
  }
  return null;
};
