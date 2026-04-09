const attractionLinks = {
  'Maasai Mara National Reserve': {
    websiteUrl: 'https://www.masaimara.travel/',
    bookingUrl: 'https://maasai-mara-reserve.com',
  },
  'Amboseli National Park': {
    websiteUrl: 'https://amboseli.com/',
    bookingUrl: 'https://www.kws.go.ke/amboseli-national-park',
  },
  'Tsavo East National Park': {
    websiteUrl: 'https://www.naturaltoursandsafaris.com/kenya-safaris/parks/tsavo-east-national-park',
    bookingUrl: 'https://kws.go.ke/tsavo-east-national-park',
  },
  'Tsavo West National Park': {
    websiteUrl: 'https://www.expertafrica.com/kenya/tsavo-west-national-park',
    bookingUrl: 'https://www.kws.go.ke/tsavo-west-national-park',
  },
  'Nairobi National Park': {
    websiteUrl: 'https://nairobipark.org/',
    bookingUrl: 'https://www.kws.go.ke/nairobi-national-park',
  },
  'Lake Nakuru National Park': {
    websiteUrl: 'https://www.lakenakurukenya.com/',
    bookingUrl: 'https://www.kws.go.ke/lake-nakuru-national-park',
  },
  'Samburu National Reserve': {
    websiteUrl: 'https://www.samburureserve.com/',
    bookingUrl: 'https://www.kws.go.ke/samburu-national-reserve',
  },
  'Mount Kenya National Park': {
    websiteUrl: 'https://www.kenyasafari.com/mount-kenya-national-park-guide.html',
    bookingUrl: 'https://www.kws.go.ke/mount-kenya-national-park-reserve',
  },
  'Aberdare National Park': {
    websiteUrl: 'https://www.aberdarenationalparks.com/',
    bookingUrl: 'https://www.kws.go.ke/aberdare-national-park',
  },
  "Hell's Gate National Park": {
    websiteUrl: 'https://www.kenya-experience.com/places-to-visit/hells-gate-national-park/',
    bookingUrl: 'https://www.kws.go.ke/hells-gate-national-park',
  },
  'Diani Beach': {
    websiteUrl: 'https://www.dianibeachmombasa.com/',
    bookingUrl: 'https://www.magicalkenya.com/destination/diani-beach',
  },
  'Watamu Marine National Park': {
    websiteUrl: 'https://www.treehouse.co.ke/marinepark',
    bookingUrl: 'https://www.kws.go.ke/watamu-marine-national-park',
  },
  'Mombasa Old Town': {
    websiteUrl: 'https://www.worldheritagesite.org/former-tentative/mombasa-old-town/',
    bookingUrl: 'https://www.museums.or.ke/fort-jesus',
  },
  'Lake Bogoria National Reserve': {
    websiteUrl: 'https://www.naturaltoursandsafaris.com/kenya-safaris/parks/lake-bogoria-national-reserve-kenya',
    bookingUrl: 'https://www.kws.go.ke/lake-bogoria-national-reserve',
  },
  'Ol Pejeta Conservancy': {
    websiteUrl: 'https://www.asiliaafrica.com/destinations/ol-pejeta/',
    bookingUrl: 'https://www.olpejetaconservancy.org',
  },
  'Arabuko Sokoke Forest': {
    websiteUrl: 'https://www.africakenyasafaris.com/kenya-national-parks/arabuko-sokoke-forest-reserve/',
    bookingUrl: 'https://www.kws.go.ke/arabuko-sokoke-forest',
  },
  'Kakamega Forest': {
    websiteUrl: 'https://kakamegaforest.com/',
    bookingUrl: 'https://www.kws.go.ke/kakamega-forest',
  },
  'Lamu Old Town': {
    websiteUrl: 'https://museums.or.ke/lamu-old-town/',
    bookingUrl: 'https://www.magicalkenya.com/destination/lamu',
  },
  'Lake Turkana': {
    websiteUrl: 'https://museums.or.ke/lake-turkana-national-parks/',
    bookingUrl: 'https://www.magicalkenya.com/destination/lake-turkana',
  },
  'Shimba Hills National Reserve': {
    websiteUrl: 'https://www.kenyasafari.com/shimba-hills-national-reserve-guide.html',
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
