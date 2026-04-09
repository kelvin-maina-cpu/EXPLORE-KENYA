export const attractionWebsiteUrls = {
  'Aberdare National Park': 'https://www.aberdarenationalparks.com/',
  'Amboseli National Park': 'https://amboseli.com/',
  'Arabuko Sokoke Forest': 'https://www.africakenyasafaris.com/kenya-national-parks/arabuko-sokoke-forest-reserve/',
  'Diani Beach': 'https://www.dianibeachmombasa.com/',
  "Hell's Gate National Park": 'https://www.kenya-experience.com/places-to-visit/hells-gate-national-park/',
  'Kakamega Forest': 'https://kakamegaforest.com/',
  'Lake Bogoria National Reserve': 'https://www.naturaltoursandsafaris.com/kenya-safaris/parks/lake-bogoria-national-reserve-kenya',
  'Lake Nakuru National Park': 'https://www.lakenakurukenya.com/',
  'Lake Turkana': 'https://museums.or.ke/lake-turkana-national-parks/',
  'Lamu Old Town': 'https://museums.or.ke/lamu-old-town/',
  'Maasai Mara National Reserve': 'https://www.masaimara.travel/',
  'Mombasa Old Town': 'https://www.worldheritagesite.org/former-tentative/mombasa-old-town/',
  'Mount Kenya National Park': 'https://www.kenyasafari.com/mount-kenya-national-park-guide.html',
  'Nairobi National Park': 'https://nairobipark.org/',
  'Ol Pejeta Conservancy': 'https://www.asiliaafrica.com/destinations/ol-pejeta/',
  'Samburu National Reserve': 'https://www.samburureserve.com/',
  'Shimba Hills National Reserve': 'https://www.kenyasafari.com/shimba-hills-national-reserve-guide.html',
  'Tsavo East National Park': 'https://www.naturaltoursandsafaris.com/kenya-safaris/parks/tsavo-east-national-park',
  'Tsavo West National Park': 'https://www.expertafrica.com/kenya/tsavo-west-national-park',
  'Watamu Marine National Park': 'https://www.treehouse.co.ke/marinepark',
};

export const getAttractionWebsiteUrl = (name, fallback = '') => attractionWebsiteUrls[name] || fallback;
