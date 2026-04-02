const API_BASE = `${window.location.origin}/api`;

const state = {
  token: localStorage.getItem('adminToken') || '',
  user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  tours: [],
  attractions: [],
  bookings: [],
  stats: null,
};

const $ = (id) => document.getElementById(id);
const loginView = $('login-view');
const dashboardView = $('dashboard-view');
const loginError = $('login-error');

const parseCsv = (value) =>
  `${value || ''}`.split(',').map((item) => item.trim()).filter(Boolean);

const parseItinerary = (value) =>
  `${value || ''}`
    .split('\n')
    .map((line, index) => {
      const [day, title, description, activities] = line.split('|').map((part) => `${part || ''}`.trim());
      return {
        day: Number(day?.replace(/[^\d]/g, '') || index + 1),
        title,
        description,
        activities: parseCsv(activities),
      };
    })
    .filter((item) => item.title && item.description);

const currency = (value) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const setMessage = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.remove('hidden');
  if (isError) {
    element.classList.add('error');
    element.classList.remove('feedback');
  } else {
    element.classList.add('feedback');
    element.classList.remove('error');
  }
};

const clearMessage = (element) => {
  element.textContent = '';
  element.classList.add('hidden');
};

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const saveSession = () => {
  localStorage.setItem('adminToken', state.token);
  localStorage.setItem('adminUser', JSON.stringify(state.user));
};

const clearSession = () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

const renderStats = () => {
  const stats = state.stats || {};
  $('stat-tours').textContent = stats.totalTours || 0;
  $('stat-attractions').textContent = stats.totalAttractions || 0;
  $('stat-bookings').textContent = stats.totalBookings || 0;
  $('stat-revenue').textContent = currency(stats.revenue || 0);
  $('welcome-title').textContent = `Welcome, ${state.user?.name || 'Admin'}`;
  $('welcome-copy').textContent = `${state.user?.email || ''} • role: ${state.user?.role || 'admin'}`;

  const recentBookings = stats.recentBookings || [];
  $('recent-bookings').innerHTML = recentBookings.length
    ? recentBookings.map((booking) => `
        <article class="booking-card">
          <div class="booking-card-head">
            <div>
              <strong>${booking.bookingRef || booking.bookingCode || 'Booking'}</strong>
              <p class="muted">${booking.userId?.name || 'Unknown traveler'} • ${booking.userId?.email || 'No email'}</p>
            </div>
            <span class="pill ${booking.paymentStatus === 'paid' ? 'success' : 'warn'}">${booking.paymentStatus || 'pending'}</span>
          </div>
          <p class="muted">Package: ${booking.package || 'custom'} • Amount: ${currency(booking.amountPaid || booking.totalAmount || 0)}</p>
        </article>
      `).join('')
    : '<p class="muted">No bookings yet.</p>';
};

const fillTourForm = (tour) => {
  $('tour-id').value = tour._id || '';
  $('tour-title').value = tour.title || '';
  $('tour-location').value = tour.location || '';
  $('tour-price').value = tour.price || 0;
  $('tour-duration').value = tour.duration || '';
  $('tour-group-size').value = tour.maxGroupSize || 10;
  $('tour-images').value = (tour.images || []).join(', ');
  $('tour-description').value = tour.description || '';
  $('tour-includes').value = (tour.includes || []).join(', ');
  $('tour-excludes').value = (tour.excludes || []).join(', ');
  $('tour-itinerary').value = (tour.itinerary || [])
    .map((item) => `${item.day} | ${item.title} | ${item.description} | ${(item.activities || []).join(', ')}`)
    .join('\n');
  $('tour-featured').checked = Boolean(tour.featured);
  $('tour-active').checked = Boolean(tour.isActive);
};

const resetTourForm = () => {
  $('tour-form').reset();
  $('tour-id').value = '';
  $('tour-group-size').value = 10;
  $('tour-active').checked = true;
  clearMessage($('tour-feedback'));
};

const renderTours = () => {
  $('tour-list').innerHTML = state.tours.length
    ? state.tours.map((tour) => `
        <article class="item-card">
          <div class="item-card-head">
            <div>
              <strong>${tour.title}</strong>
              <p class="muted">${tour.location} • ${currency(tour.price)} • ${tour.duration}</p>
            </div>
            <span class="pill ${tour.isActive ? 'success' : 'warn'}">${tour.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p class="muted">${tour.description}</p>
          <div class="item-actions">
            <button class="btn btn-secondary" data-tour-edit="${tour._id}">Edit</button>
            <button class="btn btn-ghost" data-tour-delete="${tour._id}">Delete</button>
          </div>
        </article>
      `).join('')
    : '<p class="muted">No tours yet.</p>';
};

const fillAttractionForm = (attraction) => {
  $('attraction-id').value = attraction._id || '';
  $('attraction-name').value = attraction.name || '';
  $('attraction-category').value = attraction.category || 'wildlife';
  $('attraction-county').value = attraction.county || '';
  $('attraction-description').value = attraction.description || '';
  $('attraction-latitude').value = attraction.location?.coordinates?.[1] ?? -1.2921;
  $('attraction-longitude').value = attraction.location?.coordinates?.[0] ?? 36.8219;
  $('attraction-fee-resident').value = attraction.entryFee?.resident || 0;
  $('attraction-fee-nonresident').value = attraction.entryFee?.nonResident || 0;
  $('attraction-highlights').value = (attraction.highlights || []).join(', ');
  $('attraction-images').value = (attraction.images || []).join(', ');
  $('attraction-active').checked = Boolean(attraction.isActive);
};

const resetAttractionForm = () => {
  $('attraction-form').reset();
  $('attraction-id').value = '';
  $('attraction-latitude').value = -1.2921;
  $('attraction-longitude').value = 36.8219;
  $('attraction-fee-resident').value = 0;
  $('attraction-fee-nonresident').value = 0;
  $('attraction-active').checked = true;
  clearMessage($('attraction-feedback'));
};

const renderAttractions = () => {
  $('attraction-list').innerHTML = state.attractions.length
    ? state.attractions.map((attraction) => `
        <article class="item-card">
          <div class="item-card-head">
            <div>
              <strong>${attraction.name}</strong>
              <p class="muted">${attraction.category} • ${attraction.county || 'Kenya'}</p>
            </div>
            <span class="pill ${attraction.isActive ? 'success' : 'warn'}">${attraction.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p class="muted">${attraction.description}</p>
          <div class="item-actions">
            <button class="btn btn-secondary" data-attraction-edit="${attraction._id}">Edit</button>
            <button class="btn btn-ghost" data-attraction-delete="${attraction._id}">Delete</button>
          </div>
        </article>
      `).join('')
    : '<p class="muted">No attractions yet.</p>';
};

const renderBookings = () => {
  $('booking-list').innerHTML = state.bookings.length
    ? state.bookings.map((booking) => `
        <article class="booking-card">
          <div class="booking-card-head">
            <div>
              <strong>${booking.bookingRef || booking.bookingCode || 'Booking'}</strong>
              <p class="muted">${booking.userId?.name || 'Unknown traveler'} • ${booking.userId?.email || 'No email'}</p>
            </div>
            <span class="pill ${booking.paymentStatus === 'paid' ? 'success' : 'warn'}">${booking.paymentStatus || 'pending'}</span>
          </div>
          <p class="muted">Package: ${booking.package || 'custom'} • Participants: ${booking.participants || 1}</p>
          <p class="muted">Attraction: ${booking.attractionId?.name || 'N/A'} • Date: ${formatDate(booking.date)}</p>
          <p class="muted">Amount paid: ${currency(booking.amountPaid || 0)} • Total: ${currency(booking.totalAmount || 0)}</p>
        </article>
      `).join('')
    : '<p class="muted">No bookings yet.</p>';
};

const openTab = (tabName) => {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
};

const loadAll = async () => {
  const [dashboard, tours, attractions, bookings] = await Promise.all([
    api('/admin/dashboard'),
    api('/admin/tours'),
    api('/admin/attractions'),
    api('/admin/bookings'),
  ]);
  state.stats = dashboard.stats;
  state.tours = tours.tours || [];
  state.attractions = attractions.attractions || [];
  state.bookings = bookings.bookings || [];
  renderStats();
  renderTours();
  renderAttractions();
  renderBookings();
};

const showDashboard = () => {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
};

const showLogin = () => {
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
};

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(loginError);
  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('email').value.trim(),
        password: $('password').value,
      }),
    });
    if (response.role !== 'admin') {
      throw new Error('This dashboard only allows admin accounts.');
    }
    state.token = response.token;
    state.user = { _id: response._id, name: response.name, email: response.email, role: response.role };
    saveSession();
    await loadAll();
    showDashboard();
  } catch (error) {
    setMessage(loginError, error.message, true);
  }
});

$('logout-btn').addEventListener('click', () => {
  clearSession();
  showLogin();
});

$('refresh-all').addEventListener('click', async () => {
  try {
    await loadAll();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => openTab(tab.dataset.tab));
});

document.querySelectorAll('[data-open-tab]').forEach((button) => {
  button.addEventListener('click', () => openTab(button.dataset.openTab));
});

$('tour-reset').addEventListener('click', resetTourForm);
$('attraction-reset').addEventListener('click', resetAttractionForm);

$('tour-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = $('tour-feedback');
  clearMessage(feedback);
  const payload = {
    title: $('tour-title').value,
    location: $('tour-location').value,
    price: Number($('tour-price').value),
    duration: $('tour-duration').value,
    maxGroupSize: Number($('tour-group-size').value || 10),
    description: $('tour-description').value,
    images: parseCsv($('tour-images').value),
    includes: parseCsv($('tour-includes').value),
    excludes: parseCsv($('tour-excludes').value),
    itinerary: parseItinerary($('tour-itinerary').value),
    featured: $('tour-featured').checked,
    isActive: $('tour-active').checked,
  };
  try {
    const id = $('tour-id').value;
    await api(id ? `/admin/tours/${id}` : '/admin/tours', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    await loadAll();
    resetTourForm();
    setMessage(feedback, id ? 'Tour updated successfully.' : 'Tour created successfully.');
  } catch (error) {
    setMessage(feedback, error.message, true);
  }
});

$('tour-list').addEventListener('click', async (event) => {
  const editId = event.target.dataset.tourEdit;
  const deleteId = event.target.dataset.tourDelete;
  if (editId) {
    const tour = state.tours.find((item) => item._id === editId);
    if (tour) {
      fillTourForm(tour);
      openTab('tours');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  if (deleteId && window.confirm('Delete this tour?')) {
    try {
      await api(`/admin/tours/${deleteId}`, { method: 'DELETE' });
      await loadAll();
    } catch (error) {
      alert(error.message);
    }
  }
});

$('attraction-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = $('attraction-feedback');
  clearMessage(feedback);
  const payload = {
    name: $('attraction-name').value,
    category: $('attraction-category').value,
    county: $('attraction-county').value,
    description: $('attraction-description').value,
    coordinates: {
      lat: Number($('attraction-latitude').value),
      lng: Number($('attraction-longitude').value),
    },
    entryFee: {
      resident: Number($('attraction-fee-resident').value || 0),
      nonResident: Number($('attraction-fee-nonresident').value || 0),
    },
    highlights: parseCsv($('attraction-highlights').value),
    images: parseCsv($('attraction-images').value),
    isActive: $('attraction-active').checked,
  };
  try {
    const id = $('attraction-id').value;
    await api(id ? `/admin/attractions/${id}` : '/admin/attractions', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    await loadAll();
    resetAttractionForm();
    setMessage(feedback, id ? 'Attraction updated successfully.' : 'Attraction created successfully.');
  } catch (error) {
    setMessage(feedback, error.message, true);
  }
});

$('attraction-list').addEventListener('click', async (event) => {
  const editId = event.target.dataset.attractionEdit;
  const deleteId = event.target.dataset.attractionDelete;
  if (editId) {
    const attraction = state.attractions.find((item) => item._id === editId);
    if (attraction) {
      fillAttractionForm(attraction);
      openTab('attractions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  if (deleteId && window.confirm('Delete this attraction?')) {
    try {
      await api(`/admin/attractions/${deleteId}`, { method: 'DELETE' });
      await loadAll();
    } catch (error) {
      alert(error.message);
    }
  }
});

$('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = $('upload-feedback');
  const result = $('upload-result');
  clearMessage(feedback);
  const file = $('upload-image').files[0];
  if (!file) {
    setMessage(feedback, 'Select an image first.', true);
    return;
  }
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await api('/upload/image', { method: 'POST', body: formData });
    setMessage(feedback, 'Image uploaded successfully.');
    result.innerHTML = `
      <p><strong>URL:</strong> <a href="${response.url}" target="_blank" rel="noreferrer">${response.url}</a></p>
      <p><strong>Public ID:</strong> ${response.public_id}</p>
      <img src="${response.url}" alt="Uploaded asset" />
    `;
  } catch (error) {
    setMessage(feedback, error.message, true);
  }
});

const init = async () => {
  if (!state.token || !state.user) {
    showLogin();
    return;
  }
  try {
    await loadAll();
    showDashboard();
  } catch (error) {
    clearSession();
    showLogin();
    setMessage(loginError, `Session expired: ${error.message}`, true);
  }
};

init();
