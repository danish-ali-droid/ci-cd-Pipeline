const hotelForm = document.getElementById('hotel-form');
const hotelIdInput = document.getElementById('hotel-id');
const hotelNameInput = document.getElementById('hotel-name');
const hotelLocationInput = document.getElementById('hotel-location');
const hotelRoomsInput = document.getElementById('hotel-rooms');
const hotelPriceInput = document.getElementById('hotel-price');
const hotelStatusInput = document.getElementById('hotel-status');
const hotelsTableBody = document.getElementById('hotels-table-body');
const hotelCountLabel = document.getElementById('hotel-count');
const searchInput = document.getElementById('search-input');
const cancelEditButton = document.getElementById('cancel-edit');
const emptyState = document.getElementById('empty-state');

const STORAGE_KEY = 'hotelManagementData';
let hotels = [];
let editingId = null;

function loadHotels() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    hotels = stored ? JSON.parse(stored) : [];
  } catch (err) {
    hotels = [];
  }
  renderHotels();
}

function saveHotels() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hotels));
}

function updateHotelCount() {
  const count = hotels.length;
  hotelCountLabel.textContent = `${count} hotel${count === 1 ? '' : 's'}`;
}

function resetForm() {
  hotelIdInput.value = '';
  hotelNameInput.value = '';
  hotelLocationInput.value = '';
  hotelRoomsInput.value = '10';
  hotelPriceInput.value = '120';
  hotelStatusInput.value = 'Open';
  editingId = null;
}

function createHotelRow(hotel) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${hotel.name}</td>
    <td>${hotel.location}</td>
    <td>${hotel.rooms}</td>
    <td>$${hotel.price}</td>
    <td>${hotel.status}</td>
    <td>
      <button class="action-button edit-btn" data-id="${hotel.id}">Edit</button>
      <button class="action-button delete-btn" data-id="${hotel.id}">Delete</button>
    </td>
  `;

  const editButton = row.querySelector('.edit-btn');
  const deleteButton = row.querySelector('.delete-btn');

  editButton.addEventListener('click', () => startEditHotel(hotel.id));
  deleteButton.addEventListener('click', () => deleteHotel(hotel.id));

  return row;
}

function renderHotels() {
  const query = searchInput.value.trim().toLowerCase();
  hotelsTableBody.innerHTML = '';

  const visibleHotels = hotels.filter(hotel => hotel.name.toLowerCase().includes(query));

  if (visibleHotels.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    visibleHotels.forEach(hotel => {
      hotelsTableBody.appendChild(createHotelRow(hotel));
    });
  }

  updateHotelCount();
}

function addHotel(hotel) {
  hotels.push(hotel);
  saveHotels();
  renderHotels();
}

function updateHotel(updatedHotel) {
  hotels = hotels.map(hotel => (hotel.id === updatedHotel.id ? updatedHotel : hotel));
  saveHotels();
  renderHotels();
}

function deleteHotel(id) {
  const confirmed = confirm('Delete this hotel?');
  if (!confirmed) return;

  hotels = hotels.filter(hotel => hotel.id !== id);
  saveHotels();
  renderHotels();
  if (editingId === id) {
    resetForm();
  }
}

function startEditHotel(id) {
  const hotel = hotels.find(item => item.id === id);
  if (!hotel) return;

  editingId = id;
  hotelIdInput.value = hotel.id;
  hotelNameInput.value = hotel.name;
  hotelLocationInput.value = hotel.location;
  hotelRoomsInput.value = hotel.rooms;
  hotelPriceInput.value = hotel.price;
  hotelStatusInput.value = hotel.status;
}

hotelForm.addEventListener('submit', event => {
  event.preventDefault();

  const hotelData = {
    id: editingId || `hotel-${Date.now()}`,
    name: hotelNameInput.value.trim(),
    location: hotelLocationInput.value.trim(),
    rooms: Number(hotelRoomsInput.value),
    price: Number(hotelPriceInput.value),
    status: hotelStatusInput.value,
  };

  if (!hotelData.name || !hotelData.location) {
    alert('Please enter both hotel name and location.');
    return;
  }

  if (editingId) {
    updateHotel(hotelData);
  } else {
    addHotel(hotelData);
  }

  resetForm();
});

cancelEditButton.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderHotels);

loadHotels();
