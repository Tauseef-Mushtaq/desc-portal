const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true }, // stable key, used by the seeder to stay idempotent
    description: { type: String, default: '' },
    icon: { type: String, default: 'apartment' }, // Material Symbol name
    // Which serviceType values (from ServiceRequest) route to this department.
    // A request's department is computed from this mapping, not stored
    // redundantly on the request itself.
    serviceTypes: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
