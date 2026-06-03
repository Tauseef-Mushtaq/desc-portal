require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceRequest = require('./models/ServiceRequest');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await ServiceRequest.deleteMany({});

  // Create admin
  const admin = await User.create({
    fullName: 'Admin DESC',
    email: 'admin@desc.gov.pk',
    password: 'admin123',
    role: 'admin',
    phone: '0300-0000000',
    city: 'Mardan',
    province: 'KPK',
  });

  // Create citizens
  const citizen1 = await User.create({
    fullName: 'Ahmed Hassan',
    email: 'ahmed@example.com',
    password: 'citizen123',
    cnic: '16101-1234567-1',
    phone: '0312-3456789',
    address: 'House 12, Street 4, Hoti Road',
    city: 'Mardan',
    province: 'KPK',
  });

  const citizen2 = await User.create({
    fullName: 'Fatima Khan',
    email: 'fatima@example.com',
    password: 'citizen123',
    cnic: '16101-9876543-2',
    phone: '0333-9876543',
    address: 'Flat 5, Block B, Gulshan Colony',
    city: 'Mardan',
    province: 'KPK',
  });

  // Sample requests
  const serviceTypes = ['water_supply', 'road_maintenance', 'electricity', 'sewerage', 'birth_certificate'];
  const statuses = ['submitted', 'in_review', 'approved', 'resolved', 'rejected'];
  const priorities = ['low', 'normal', 'high', 'urgent'];

  for (let i = 0; i < 20; i++) {
    const type = serviceTypes[i % serviceTypes.length];
    const status = statuses[i % statuses.length];
    await ServiceRequest.create({
      citizen: i % 2 === 0 ? citizen1._id : citizen2._id,
      applicantName: i % 2 === 0 ? citizen1.fullName : citizen2.fullName,
      applicantEmail: i % 2 === 0 ? citizen1.email : citizen2.email,
      applicantCnic: i % 2 === 0 ? citizen1.cnic : citizen2.cnic,
      applicantPhone: i % 2 === 0 ? citizen1.phone : citizen2.phone,
      applicantAddress: i % 2 === 0 ? citizen1.address : citizen2.address,
      serviceType: type,
      subject: `${type.replace('_', ' ')} Issue in Ward ${i + 1}`,
      description: `There is a serious issue with ${type.replace(/_/g, ' ')} in our area. Requesting immediate attention from the authorities.`,
      priority: priorities[i % priorities.length],
      status,
      district: 'Mardan',
      timeline: [
        { status: 'submitted', note: 'Request submitted', updatedByName: 'System' },
        ...(status !== 'submitted' ? [{ status, note: `Status updated to ${status}`, updatedByName: admin.fullName, updatedBy: admin._id }] : []),
      ],
    });
  }

  console.log('✅ Seeded successfully!');
  console.log('Admin: admin@desc.gov.pk / admin123');
  console.log('Citizen: ahmed@example.com / citizen123');
  await mongoose.disconnect();
};

seed().catch((e) => { console.error(e); process.exit(1); });
