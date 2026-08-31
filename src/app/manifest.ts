import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ระบบจัดเก็บค่าธรรมเนียมขยะ',
    short_name: 'จ่ายค่าขยะ',
    description: 'ระบบตรวจสอบและชำระค่าธรรมเนียมขยะ เทศบาลเมืองนางรอง',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#0F172A',
    icons: [
      {
        src: '/nangrong-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/nangrong-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
