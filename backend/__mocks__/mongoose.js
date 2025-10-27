const mongooseMock = {
  Schema: class Schema {
    constructor(schema) { this.schema = schema; }
    virtual() { return { get: () => {} }; }
    pre() {}
    post() {}
    index() {}
    methods = {};
    statics = {};
  },
  model: jest.fn((name, schema) => {
    const Model = function(data) { Object.assign(this, data); };
    Model.find = jest.fn().mockResolvedValue([]);
    Model.findOne = jest.fn().mockResolvedValue(null);
    Model.findById = jest.fn().mockResolvedValue(null);
    Model.create = jest.fn(data => Promise.resolve(data));
    Model.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    Model.findByIdAndDelete = jest.fn().mockResolvedValue({});
    Model.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
    Model.countDocuments = jest.fn().mockResolvedValue(0);
    Model.aggregate = jest.fn().mockResolvedValue([]);
    Model.prototype.save = jest.fn().mockResolvedValue({});
    Model.prototype.remove = jest.fn().mockResolvedValue({});
    return Model;
  }),
  connect: jest.fn(() => Promise.resolve(mongooseMock)),
  disconnect: jest.fn(() => Promise.resolve()), // Added disconnect
  connection: {
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn().mockResolvedValue(),
    readyState: 1
  },
  Types: {
    ObjectId: class ObjectId {
      constructor(id) { this.id = id || 'mockid'; }
      toString() { return this.id; }
    }
  }
};

module.exports = mongooseMock;
