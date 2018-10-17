const _ = require('lodash');
const mustache = require('mustache');

const suggestionExtensions = require('../../../extensions/suggestions');
const { debug, warning } = require('../../../utils/logger')('ia:actions:middlewares:suggestions');

/**
 * Middleware
 * Fetch suggestions for slots
 *
 * @param exclude {Array} - exclude slots
 * @param slots
 * @param suggestionsScheme
 * @returns {Promise}
 */
module.exports = ({ exclude = [] } = {}) => (context) => {
  // TODO: migrate to the `...rest` style
  // once Google Firebase migrates to modern Node.js
  debug('start');
  const { app, slots, suggestionsScheme } = context;
  if (!suggestionsScheme) {
    warning(`skip middleware becase we don't have any suggestion scheme here`);
    return Promise.resolve(context);
  }

  let suggestions = suggestionsScheme.suggestions;

  if (suggestions) {
    debug('have static suggestions', suggestions);
    return Promise.resolve(
      Object.assign({}, context, { slots: Object.assign({}, slots, { suggestions }) }, { suggestions })
    );
  }

  const slotNames = suggestionsScheme.confirm || suggestionsScheme.slots;
  let provider = suggestionExtensions.getSuggestionProviderForSlots(slotNames);
  if (!provider) {
    provider = suggestionExtensions.getSuggestionProviderForSubSetOfSlots(slotNames);
    if (!provider) {
      warning(`don't have any suggestions for: ${slotNames}. Maybe we should add them.`);
      return Promise.resolve(context);
    }
    debug('we found partly matched suggestion provider');
  }

  return provider({ app, slots: _.omit(slots, exclude) })
    .then(res => {
      let suggestions;
      if (suggestionsScheme.suggestionTemplate) {
        suggestions = res.items.map(
          item => mustache.render(suggestionsScheme.suggestionTemplate, item)
        );
      } else {
        suggestions = res.items.map(
          item => {
            if (typeof item === 'object') {
              return _.values(item).join(' ');
            } else {
              return item;
            }
          }
        );
      }
      debug('new suggestions are:', suggestions);
      return Object.assign(
        {}, context, { slots: Object.assign({}, slots, { suggestions }) }, { suggestions }
      );
    });
};
