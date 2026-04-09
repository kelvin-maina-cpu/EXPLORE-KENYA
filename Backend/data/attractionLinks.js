const attractionLinks = {
  'Maasai Mara National Reserve': {
    websiteUrl: 'https://maasai-mara-reserve.com',
    bookingUrl: 'https://maasai-mara-reserve.com',
  },
  'Amboseli National Park': {
    websiteUrl: 'https://www.kws.go.ke/amboseli-national-park',
    bookingUrl: 'https://www.kws.go.ke/amboseli-national-park',
  },
  'Tsavo East National Park': {
    websiteUrl: 'https://kws.go.ke/tsavo-east-national-park',
    bookingUrl: 'https://kws.go.ke/tsavo-east-national-park',
  },
  'Tsavo West National Park': {
    websiteUrl: 'https://www.kws.go.ke/tsavo-west-national-park',
    bookingUrl: 'https://www.kws.go.ke/tsavo-west-national-park',
  },
  'Nairobi National Park': {
    websiteUrl: 'https://www.kws.go.ke/nairobi-national-park',
    bookingUrl: 'https://www.kws.go.ke/nairobi-national-park',
  },
  'Lake Nakuru National Park': {
    websiteUrl: 'https://www.kws.go.ke/lake-nakuru-national-park',
    bookingUrl: 'https://www.kws.go.ke/lake-nakuru-national-park',
  },
  'Samburu National Reserve': {
    websiteUrl: 'https://www.kws.go.ke/samburu-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/samburu-national-reserve',
  },
  'Mount Kenya National Park': {
    websiteUrl: 'https://www.kws.go.ke/mount-kenya-national-park-reserve',
    bookingUrl: 'https://www.kws.go.ke/mount-kenya-national-park-reserve',
  },
  'Aberdare National Park': {
    websiteUrl: 'https://www.kws.go.ke/aberdare-national-park',
    bookingUrl: 'https://www.kws.go.ke/aberdare-national-park',
  },
  "Hell's Gate National Park": {
    websiteUrl: 'https://www.kws.go.ke/hells-gate-national-park',
    bookingUrl: 'https://www.kws.go.ke/hells-gate-national-park',
  },
  'Diani Beach': {
    websiteUrl: 'https://www.magicalkenya.com/destination/diani-beach',
    bookingUrl: 'https://www.magicalkenya.com/destination/diani-beach',
  },
  'Watamu Marine National Park': {
    websiteUrl: 'https://www.kws.go.ke/watamu-marine-national-park',
    bookingUrl: 'https://www.kws.go.ke/watamu-marine-national-park',
  },
  'Mombasa Old Town': {
    websiteUrl: 'https://www.museums.or.ke/fort-jesus',
    bookingUrl: 'https://www.museums.or.ke/fort-jesus',
  },
  'Lake Bogoria National Reserve': {
    websiteUrl: 'https://www.kws.go.ke/lake-bogoria-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/lake-bogoria-national-reserve',
  },
  'Ol Pejeta Conservancy': {
    websiteUrl: 'https://www.olpejetaconservancy.org',
    bookingUrl: 'https://www.olpejetaconservancy.org',
  },
  'Arabuko Sokoke Forest': {
    websiteUrl: 'https://www.kws.go.ke/arabuko-sokoke-forest',
    bookingUrl: 'https://www.kws.go.ke/arabuko-sokoke-forest',
  },
  'Kakamega Forest': {
    websiteUrl: 'https://www.kws.go.ke/kakamega-forest',
    bookingUrl: 'https://www.kws.go.ke/kakamega-forest',
  },
  'Lamu Old Town': {
    websiteUrl: 'https://www.magicalkenya.com/destination/lamu',
    bookingUrl: 'https://www.magicalkenya.com/destination/lamu',
  },
  'Lake Turkana': {
    websiteUrl: 'https://www.magicalkenya.com/destination/lake-turkana',
    bookingUrl: 'https://www.magicalkenya.com/destination/lake-turkana',
  },
  'Shimba Hills National Reserve': {
    websiteUrl: 'https://www.kws.go.ke/shimba-hills-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/shimba-hills-national-reserve',
  },
};

const withAttractionLinks = (attraction) => ({
  ...attraction,
  ...(attractionLinks[attraction.name] || {}),
});

module.exports = {
  attractionLinks,
  withAttractionLinks,
};
