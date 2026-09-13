import { db } from './src/db/index';
import { examPapers, transactions, contactMessages } from './src/db/schema';

const papers = [
  {
    unitName: 'Mathematics',
    unitCode: 'MATH101',
    year: '2024',
    price: 'KSh 50',
    isAvailable: true,
    downloadsCount: 152,
    docId: 'MKU-MATH101-2024-001',
  },
  {
    unitName: 'Computer Programming',
    unitCode: 'COMP102',
    year: '2024',
    price: 'KSh 50',
    isAvailable: true,
    downloadsCount: 94,
    docId: 'MKU-COMP102-2024-002',
  },
  {
    unitName: 'Database Management Systems',
    unitCode: 'COMP201',
    year: '2023',
    price: 'KSh 50',
    isAvailable: true,
    downloadsCount: 86,
    docId: 'MKU-COMP201-2023-003',
  },
  {
    unitName: 'Financial Accounting',
    unitCode: 'BUSS105',
    year: '2024',
    price: 'KSh 50',
    isAvailable: true,
    downloadsCount: 114,
    docId: 'MKU-BUSS105-2024-004',
  },
  {
    unitName: 'Microeconomics',
    unitCode: 'ECON101',
    year: '2023',
    price: 'KSh 50',
    isAvailable: true,
    downloadsCount: 73,
    docId: 'MKU-ECON101-2023-005',
  },
  {
    unitName: 'Human Anatomy & Physiology',
    unitCode: 'NURS101',
    year: '2024',
    price: 'KSh 50',
    isAvailable: false,
    downloadsCount: 54,
    docId: 'MKU-NURS101-2024-006',
  }
];

const txs = [
  {
    studentFirstName: 'Collins',
    studentSecondName: 'Angima',
    phone: '0712345678',
    unitCode: 'MATH101',
    unitName: 'Mathematics',
    price: 'KSh 50',
    mpesaReceipt: 'QK89X2PL91',
    passwordUsed: 'Collins',
    status: 'Completed',
  },
  {
    studentFirstName: 'Mercy',
    studentSecondName: 'Wanjiku',
    phone: '0722987654',
    unitCode: 'COMP102',
    unitName: 'Computer Programming',
    price: 'KSh 50',
    mpesaReceipt: 'QK89W7MK12',
    passwordUsed: 'Mercy',
    status: 'Completed',
  },
  {
    studentFirstName: 'Brian',
    studentSecondName: 'Ochieng',
    phone: '0711456789',
    unitCode: 'BUSS105',
    unitName: 'Financial Accounting',
    price: 'KSh 50',
    mpesaReceipt: 'QK89V4JN88',
    passwordUsed: 'Brian',
    status: 'Completed',
  },
  {
    studentFirstName: 'Esther',
    studentSecondName: 'Achieng',
    phone: '0798123456',
    unitCode: 'ECON101',
    unitName: 'Microeconomics',
    price: 'KSh 50',
    mpesaReceipt: 'QK89U2LL45',
    passwordUsed: 'Esther',
    status: 'Completed',
  }
];

const msgs = [
  {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '0712345678',
    subject: 'Unit Inquiry: MATH101',
    message: 'I am looking for the past paper / marking scheme for unit: MATH101. Is it available for 2024?',
    isRead: false,
  },
  {
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '0722345678',
    subject: 'Technical Support / Account Issue',
    message: 'I paid but did not receive the password for my downloaded PDF. Please assist.',
    isRead: true,
  }
];

async function seed() {
  console.log('Seeding Database...');
  await db.insert(examPapers).values(papers);
  await db.insert(transactions).values(txs);
  await db.insert(contactMessages).values(msgs);
  console.log('Done!');
  process.exit(0);
}

seed().catch(console.error);
