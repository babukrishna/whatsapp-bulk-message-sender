import { Contact } from '../types';
import { normalizePhoneNumber } from './phoneValidator';

export const SAMPLE_CONTACTS_RAW = [
  { name: 'Pooja Sharma', phone: '9876543210', nickname: 'Pooja', city: 'Delhi', notes: 'Prefers besan laddus & moong halwa' },
  { name: 'Rajesh Verma', phone: '+91 98111 22334', nickname: 'Rajesh ji', city: 'Noida', notes: 'Diwali sweet box inquiry' },
  { name: 'Ananya Iyer', phone: '+91 98234 56789', nickname: 'Anu', city: 'Bengaluru', notes: 'Loves spicy mixture & murukku' },
  { name: 'Vikram Mehta', phone: '09845012345', nickname: 'Vikram', city: 'Mumbai', notes: 'Ordered 2kg kaju katli last month' },
  { name: 'Sunita Patel', phone: '9898765432', nickname: 'Sunita Didi', city: 'Ahmedabad', notes: 'Favorite: dry fruit barfi' },
  { name: 'Rohan Gupta', phone: '9712345678', nickname: 'Rohan', city: 'Jaipur', notes: 'Enquired about wedding hampers' },
  { name: 'Meenakshi Sundaram', phone: '+91 94440 12345', nickname: 'Meena', city: 'Chennai', notes: 'Asked for gluten-free options' },
  { name: 'Amit Saxena', phone: '9820011223', nickname: 'Amit', city: 'Lucknow', notes: 'College friend, loves pinni' },
  { name: 'Kavita Chawla', phone: '+91 (987) 612-3456', nickname: 'Kavita', city: 'Chandigarh', notes: 'Corporate gifting discussion' },
  { name: 'Sanjay Joshi', phone: '9988776655', nickname: 'Sanjay Bhai', city: 'Pune', notes: 'Chivda and peda lover' },
  { name: 'Divya Nair', phone: '9495012345', nickname: 'Divya', city: 'Kochi', notes: 'Requested coconut ladoo batch' },
  { name: 'Harpreet Singh', phone: '9815099887', nickname: 'Happy', city: 'Amritsar', notes: 'Regular winter pinni customer' },
  { name: 'Neha Agrawal', phone: '9755512345', nickname: 'Neha', city: 'Indore', notes: 'Loves namkeen and sev' },
  { name: 'Tarun Banerjee', phone: '9830012345', nickname: 'Tarun Da', city: 'Kolkata', notes: 'Sondesh & rasgulla enthusiast' },
  { name: 'Karan Kapoor', phone: '12345', nickname: 'Karan', city: 'Delhi', notes: 'Demonstration of an invalid incomplete phone number' },
];

export function generateSampleContacts(defaultCountryCode = '+91'): Contact[] {
  return SAMPLE_CONTACTS_RAW.map((item, idx) => {
    const val = normalizePhoneNumber(item.phone, defaultCountryCode);
    return {
      id: `demo_${Date.now()}_${idx}`,
      name: item.name,
      phone: val.display || item.phone,
      normalizedPhone: val.normalized,
      isValidPhone: val.isValid,
      phoneError: val.error,
      nickname: item.nickname,
      city: item.city,
      language: 'English/Hindi',
      notes: item.notes,
      status: idx === 0 ? 'Ready' : 'Not Started',
      createdAt: new Date().toISOString(),
    };
  });
}
