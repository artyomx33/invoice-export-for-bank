import { PayingCompanyConfig } from '../types/Invoice';

export const PAYING_COMPANIES: PayingCompanyConfig[] = [
  {
    id: 'teddy-kids',
    name: 'Teddy Kids',
    fullName: 'Teddy Kids B.V.',
    iban: 'NL21RABO0175461910',
    bic: 'RABONL2U',
    address: {
      street: 'Rijnsburgerweg',
      postalCode: '2334BA',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '028ecb7182cd42c88ef28ca422f70c10'
  },
  {
    id: 'tisa',
    name: 'TISA',
    fullName: 'TISA - Teddy Kids B.V.',
    iban: 'NL72RABO0377186945',
    bic: 'RABONL2U',
    address: {
      street: 'Lorentzkade',
      postalCode: '2313GB',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '2bcb032d54f74ecca8628347cd6b58a7'
  },
  {
    id: 'teddy-daycare',
    name: 'Teddy Daycare',
    fullName: 'Teddy Kids Daycare',
    iban: 'NL62RABO0383960053',
    bic: 'RABONL2U',
    address: {
      street: 'Rijnsburgerweg',
      postalCode: '2334BE',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: 'b2328cd951c44f6aa82cad3ed1db05b6'
  },
  {
    id: 'teddy-cafe',
    name: 'Teddy Cafe',
    fullName: 'Teddy\'s Cafe B.V.',
    iban: 'NL81RABO0340536691',
    bic: 'RABONL2U',
    address: {
      street: 'Lorentzkade',
      postalCode: '2313GB',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '7e3ff2448e6a4197a63c0ddfc8575a78'
  }
];
