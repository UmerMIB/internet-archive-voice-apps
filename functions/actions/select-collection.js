const debug = require('debug')('ia:actions:select-collection:debug');

const dialog = require('../dialog');
const collection = require('../provider/collection');
const querySlots = require('../state/query');
const selectCollectionStrings = require('../strings').intents.selectCollection;
const util = require('util');

function handler (app) {
  debug(`Start handle select collection`);

  const collectionId = app.getArgument('collection');
  querySlots.setSlot(app, 'collection', collectionId);

  return collection.fetchDetails(collectionId)
    .then(details => {
      // TODO: we could add storage of fetch collection
      // if we will need title of collection later
      dialog.ask(app, {
        speech: util.format(selectCollectionStrings.speech, details.title),
      });
    });
}

module.exports = {
  handler,
};
