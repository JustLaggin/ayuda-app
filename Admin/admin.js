import { auth, db } from '../firebase-config.js';
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ========== DOM Elements ========== */
const settingsBtn = document.getElementById('settingsBtn');
const userNameEl = document.getElementById('userName');
const Ayudaform = document.getElementById('Ayudaform');
const ayudasList = document.getElementById('ayudasList');

/* Input fields */
const ayudatitle = document.getElementById('ayudatitle');
const amount = document.getElementById('amount');
const city = document.getElementById('city');
const barangay = document.getElementById('barangay');
const schedule = document.getElementById('schedule');
const requirements = document.getElementById('requirements');
const address = document.getElementById('address');
const description = document.getElementById('description');


/* ========== AUTH STATE LISTENER ========== */
onAuthStateChanged(auth, async (user) => {

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      userNameEl.textContent = `Welcome, ${data.fullName || 'Admin'}`;
    } else {
      userNameEl.textContent = "Welcome, Admin 👋";
    }

    // Load existing ayudas when logged in
    await loadAyudas();
  } catch (error) {
    console.error("🔥 Error fetching user data:", error);
    userNameEl.textContent = "Welcome, Admin 👋";
  }
});

/* ========== SETTINGS BUTTON ========== */
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    window.location.href = '../../update-profile.html';
  });
}

/* ========== CREATE NEW AYUDA ========== */
Ayudaform.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const ayudaData = {
      title: ayudatitle.value.trim(),
      amount: parseFloat(amount.value),
      city: city.value,
      barangay: barangay.value || 'All',
      schedule: schedule.value || 'TBA',
      requirements: requirements.value || '',
      claiming_area: address.value || 'TBA',
      description: description.value,
      status: true,
      applicants: [],
      beneficiaries: []
    };

    // Add to Firestore
    await addDoc(collection(db, 'ayudas'), ayudaData);
    console.log('✅ Ayuda successfully created!');

    // Reset form
    Ayudaform.reset();

    // Refresh list
    await loadAyudas();
  } catch (error) {
    console.error('❌ Error creating ayuda:', error);
    alert('Failed to create ayuda. Check console for details.');
  }
});

/* ========== LOAD EXISTING AYUDAS ========== */
async function loadAyudas() {
  try {
    ayudasList.innerHTML = '<p>Loading ayudas...</p>';
    const ayudasSnap = await getDocs(collection(db, 'ayudas'));
    ayudasList.innerHTML = ''; // clear previous

    if (ayudasSnap.empty) {
      ayudasList.innerHTML = '<p>No ayudas found yet.</p>';
      return;
    }

    ayudasSnap.forEach(docSnap => {
      const ayuda = docSnap.data();
      const ayudaCard = document.createElement('div');
      ayudaCard.classList.add('ayuda-card');

      ayudaCard.innerHTML = `
      <div class="ayuda">
        <h3>${ayuda.title}</h3>
        <p><strong>Amount:</strong> ₱${ayuda.amount}</p>
        <p><strong>Location:</strong> ${ayuda.city}, ${ayuda.barangay}</p>
        <p><strong>Schedule:</strong> ${ayuda.schedule }</p>
        <p><strong>Claiming Area:</strong> ${ayuda.claiming_area }</p>
        <p><strong>Requirements:</strong> ${ayuda.requirements}</p>
        <p><strong>Description:</strong> ${ayuda.description}</p>
        <p><strong>Applicants:</strong> ${ayuda.applicants?.length || 0}</p>
        <p><strong>Beneficiaries:</strong> ${ayuda.beneficiaries?.length || 0}</p>
        <p><strong>Status:</strong> ${ayuda.status ? 'Open' : 'Closed'}</p>
        <button onclick="viewApplicants('${docSnap.id}')">View Applicants</button>
        <button onclick="viewBeneficiary('${docSnap.id}')">View Beneficiaries</button>
        <button onclick="updateData('${docSnap.id}')">Update Data</button>
      </div>
      `;

      ayudasList.appendChild(ayudaCard);
    });
  } catch (error) {
    console.error('Error loading ayudas:', error);
    ayudasList.innerHTML = '<p>Failed to load ayudas. Check console.</p>';
  }
}

/* ========== DYNAMIC BARANGAY SELECTION ========== */
const barangaysByCity = {
  "Batangas City": [
    "Alangilan",
    "Pallocan",
    "Sta. Rita",
    "San Isidro",
    "Kumintang Ibaba",
    "Bolbok",
    "Calicanto",
    "Libjo",
    "Tingga Itaas",
    "Santo Niño"
  ],
  "Lipa City": [
    "Balintawak",
    "Sabang",
    "Anilao",
    "Marawoy",
    "Banaybanay",
    "Bolbok",
    "Sico",
    "Tambo",
    "Plaridel",
    "San Carlos"
  ],
  "Tanauan City": [
    "Natatas",
    "Sala",
    "Sambat",
    "Poblacion",
    "Darasa",
    "Trapiche",
    "Malaking Pulo",
    "Pantay Matanda",
    "Pagaspas",
    "Bañadero"
  ],
  "Sto. Tomas City": [
    "San Roque",
    "Sta. Anastacia",
    "San Bartolome",
    "San Rafael",
    "San Pedro",
    "San Vicente",
    "San Antonio",
    "San Agustin",
    "San Felix",
    "San Francisco"
  ],
  "Bauan": [
    "San Miguel",
    "Manghinao",
    "Aplaya",
    "Sampaguita",
    "San Andres",
    "San Pascual",
    "Cupang",
    "Durungao",
    "Sinala",
    "Bolo"
  ],
  "San Jose": [
    "Pinagtungulan",
    "Palanca",
    "Bagong Pook",
    "Bigain",
    "Lalayat",
    "Lapulapu",
    "Poblacion",
    "Salaban",
    "Tugtug",
    "Lumil"
  ],
  "Taal": [
    "Apacay",
    "Pansipit",
    "Buli",
    "Poblacion",
    "Caysasay",
    "Cubamba",
    "Bihis",
    "Luntal",
    "Seiran",
    "Caricaran"
  ]

};

// Populate barangays dynamically
city.addEventListener('change', () => {
  const selectedCity = city.value;
  barangay.innerHTML = '<option value="All" selected>All</option>';

  if (selectedCity === 'All') {
    barangay.disabled = true;
    return;
  }

  const options = barangaysByCity[selectedCity] || [];
  options.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    barangay.appendChild(opt);
  });

  barangay.disabled = false;
});

window.viewApplicants = async function (ayudaId) {
  try {
    applicantsModal.style.display = 'flex'; // Show modal
    applicantsList.innerHTML = '<p>Loading applicants...</p>';

    const ayudaRef = doc(db, 'ayudas', ayudaId);
    const ayudaSnap = await getDoc(ayudaRef);

    if (!ayudaSnap.exists()) {
      applicantsList.innerHTML = '<p>Ayuda not found.</p>';
      return;
    }

    const ayuda = ayudaSnap.data();
    const applicants = ayuda.applicants || [];

    if (applicants.length === 0) {
      applicantsList.innerHTML = '<p>No applicants yet.</p>';
      return;
    }

    // 🟢 Fetch user info for each applicant UID
    const applicantDocs = await Promise.all(
      applicants.map(async (uid) => {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return `${userData.fullName } `;
        } else {
          return 'Unknown User';
        }
      })
    );

    // Render applicant list
    applicantsList.innerHTML = applicantDocs
      .map((name, i) => `<p><strong>${i + 1}.</strong> ${name}</p>`)
      .join('');

  } catch (error) {
    console.error('Error fetching applicants:', error);
    applicantsList.innerHTML = '<p>Failed to load applicants.</p>';
  }
};


// Close modal when clicking the X button
closeApplicants.addEventListener('click', () => {
  applicantsModal.style.display = 'none';
});