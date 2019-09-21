module.exports = {
  attributes: {
    num: { type: 'number' }
  },
  next(id, cb) {
    const collection = Sequence.getDatastore().manager.collection('sequence');

    collection.findAndModify(
      { _id: id },
      [['_id', 'asc']],
      { $inc: { num: 1 } },
      { new: true, upsert: true },
      (err, data) => cb(err, data.value.num)
    );
  }
};
