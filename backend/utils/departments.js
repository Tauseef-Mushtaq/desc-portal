const Department = require('../models/Department');

// Groups the existing ServiceRequest.serviceType values into real
// departments — DESC actually has separate teams for these, so this isn't
// an arbitrary split. "general-services" is a catchall for serviceType
// 'other' so every request always has somewhere to land.
const DEPARTMENT_SEED = [
  {
    name: 'Water & Sanitation Department',
    slug: 'water-sanitation',
    description: 'Water supply connections, leaks, and sewerage complaints',
    icon: 'water_drop',
    serviceTypes: ['water_supply', 'sewerage'],
  },
  {
    name: 'Energy Department',
    slug: 'energy',
    description: 'Electricity connections, outages, and billing issues',
    icon: 'bolt',
    serviceTypes: ['electricity'],
  },
  {
    name: 'Public Works Department',
    slug: 'public-works',
    description: 'Road maintenance and building permits',
    icon: 'construction',
    serviceTypes: ['road_maintenance', 'building_permit'],
  },
  {
    name: 'Civil Registration Department',
    slug: 'civil-registration',
    description: 'Birth and death certificates',
    icon: 'description',
    serviceTypes: ['birth_certificate', 'death_certificate'],
  },
  {
    name: 'Revenue & Taxation Department',
    slug: 'revenue-taxation',
    description: 'Property tax assessments and payments',
    icon: 'receipt_long',
    serviceTypes: ['property_tax'],
  },
  {
    name: 'Trade & Licensing Department',
    slug: 'trade-licensing',
    description: 'Business license applications and renewals',
    icon: 'store',
    serviceTypes: ['business_license'],
  },
  {
    name: 'General Services',
    slug: 'general-services',
    description: 'Anything that does not fall under a specific department',
    icon: 'apartment',
    serviceTypes: ['other'],
  },
];

// Idempotent — safe to call on every server start. Matches on `slug` so
// re-running it never creates duplicates, and keeps each department's
// serviceTypes mapping in sync if DEPARTMENT_SEED above is ever edited.
async function ensureDepartmentsSeeded() {
  for (const dept of DEPARTMENT_SEED) {
    await Department.findOneAndUpdate(
      { slug: dept.slug },
      { $set: dept },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ ${DEPARTMENT_SEED.length} departments verified/seeded`);
}

// Builds a { serviceType: department } lookup map from whatever's actually
// in the database (not the hardcoded seed list), so admin-managed changes
// to a department's serviceTypes are respected.
async function getServiceTypeDepartmentMap() {
  const departments = await Department.find();
  const map = {};
  for (const dept of departments) {
    for (const type of dept.serviceTypes) {
      map[type] = { _id: dept._id, name: dept.name, icon: dept.icon };
    }
  }
  return map;
}

// Attaches `department` ({_id, name, icon}) to a single request based on
// its serviceType, without persisting anything — purely a read-time enrichment.
async function withDepartment(request) {
  if (!request) return request;
  const obj = typeof request.toObject === 'function' ? request.toObject() : { ...request };
  const map = await getServiceTypeDepartmentMap();
  obj.department = map[obj.serviceType] || null;
  return obj;
}

async function withDepartmentMany(requests) {
  const map = await getServiceTypeDepartmentMap();
  return (requests || []).map((r) => {
    const obj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
    obj.department = map[obj.serviceType] || null;
    return obj;
  });
}

// The actual access-control boundary for department-scoped admins: returns
// a Mongo query fragment that, merged into any ServiceRequest query, limits
// results to that admin's department. Super-admins (user.department is
// null/unset) get {} — no restriction. If a department was assigned but no
// longer exists, this deliberately returns a filter that matches nothing
// rather than falling through to "see everything".
async function getScopeFilter(user) {
  if (!user || !user.department) return {};
  const dept = await Department.findById(user.department);
  if (!dept) return { serviceType: { $in: [] } };
  return { serviceType: { $in: dept.serviceTypes } };
}

// Given a scope filter from getScopeFilter() and a serviceType, is that
// service type actually inside the scope? Used for direct-ID access checks
// (GET/PUT /requests/:id) where a list-level $in filter doesn't apply.
function isServiceTypeInScope(scopeFilter, serviceType) {
  if (!scopeFilter.serviceType) return true; // super-admin, unrestricted
  return scopeFilter.serviceType.$in.includes(serviceType);
}

module.exports = {
  DEPARTMENT_SEED,
  ensureDepartmentsSeeded,
  getServiceTypeDepartmentMap,
  withDepartment,
  withDepartmentMany,
  getScopeFilter,
  isServiceTypeInScope,
};
