const normalizeAttractionName = (value = '') =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const attractionImageMap = {
  [normalizeAttractionName('Maasai Mara National Reserve')]: require('../assets/attractions/maasai-mara-national-reserve.jpg'),
  [normalizeAttractionName('Amboseli National Park')]: require('../assets/attractions/amboseli-national-park.jpg'),
  [normalizeAttractionName('Tsavo East National Park')]: require('../assets/attractions/tsavo-east-national-park.jpg'),
  [normalizeAttractionName('Tsavo West National Park')]: require('../assets/attractions/tsavo-west-national-park.jpg'),
  [normalizeAttractionName('Nairobi National Park')]: require('../assets/attractions/nairobi-national-park.webp'),
  [normalizeAttractionName('Lake Nakuru National Park')]: require('../assets/attractions/lake-nakuru-national-park.jpg'),
  [normalizeAttractionName('Samburu National Reserve')]: require('../assets/attractions/samburu-national-reserve.jpg'),
  [normalizeAttractionName('Mount Kenya National Park')]: require('../assets/attractions/mount-kenya-national-park.jpg'),
  [normalizeAttractionName('Aberdare National Park')]: require('../assets/attractions/aberdare-national-park.jpeg'),
  [normalizeAttractionName("Hell's Gate National Park")]: require('../assets/attractions/hells-gate-national-park.jpg'),
  [normalizeAttractionName('Diani Beach')]: require('../assets/attractions/diani-beach.jpg'),
  [normalizeAttractionName('Watamu Marine National Park')]: require('../assets/attractions/watamu-marine-national-park.jpeg'),
  [normalizeAttractionName('Mombasa Old Town')]: require('../assets/attractions/mombasa-old-town.png'),
  [normalizeAttractionName('Lake Bogoria National Reserve')]: require('../assets/attractions/lake-bogoria-national-reserve.jpg'),
  [normalizeAttractionName('Ol Pejeta Conservancy')]: require('../assets/attractions/ol-pejeta-conservancy.jpg'),
  [normalizeAttractionName('Arabuko Sokoke Forest')]: require('../assets/attractions/arabuko-sokoke-forest.jpeg'),
  [normalizeAttractionName('Kakamega Forest')]: require('../assets/attractions/kakamega-forest.jpeg'),
  [normalizeAttractionName('Lamu Old Town')]: require('../assets/attractions/lamu-old-town.jpeg'),
  [normalizeAttractionName('Lake Turkana')]: require('../assets/attractions/lake-turkana.jpg'),
  [normalizeAttractionName('Shimba Hills National Reserve')]: require('../assets/attractions/shimba-hills-national-reserve.jpg'),
};

export const getAttractionImageSource = (name) => attractionImageMap[normalizeAttractionName(name)] || null;
