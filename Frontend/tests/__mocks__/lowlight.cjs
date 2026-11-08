// lowlight ships ESM only. Highlighting is cosmetic, so unit tests use this stand-in.
const empty = () => ({ children: [] });
module.exports = {
  common: {},
  createLowlight: () => ({ highlight: empty, highlightAuto: empty, listLanguages: () => [], registered: () => false }),
};
