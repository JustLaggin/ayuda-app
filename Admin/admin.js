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
  updateDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ========== DOM Elements ========== */
const settingsBtn = document.getElementById('settingsBtn');
const userNameEl = document.getElementById('userName');
const Ayudaform = document.getElementById('Ayudaform');
const ayudasList = document.getElementById('ayudasList');
const applicantsModal = document.getElementById('applicantsModal');

/* Input fields */
const ayudatitle = document.getElementById('ayudatitle');
const amount = document.getElementById('amount');
const city = document.getElementById('city');
const barangay = document.getElementById('barangay');
const schedule = document.getElementById('schedule');
const requirements = document.getElementById('requirements');
const address = document.getElementById('address');
const description = document.getElementById('description');

// Form fields
const updateAmount = document.getElementById('updateAmount');
const updateCity = document.getElementById('updateCity');
const updateBarangay = document.getElementById('updateBarangay');
const updateClaimingArea = document.getElementById('updateClaimingArea');
const updateDescription = document.getElementById('updateDescription');
const updateRequirements = document.getElementById('updateRequirements');
const updateSchedule = document.getElementById('updateSchedule');
const updateStatus = document.getElementById('updateStatus');
const updateAyudaForm = document.getElementById('updateAyudaForm');

const closeApplicants = document.getElementById('closeApplicants');
const closeBeneficiary = document.getElementById('closeBeneficiary');
const closeUpdateModal = document.getElementById('closeUpdateModal');

console.log('DOM check ->',
  { applicantsModal: !!applicantsModal,
    applicantsList: !!applicantsList,
    closeApplicants: !!closeApplicants,
    beneficiaryModal: !!beneficiaryModal,
    beneficiaryList: !!beneficiaryList,
    closeBeneficiary: !!closeBeneficiary,
    updateAyudaModal: !!updateAyudaModal,
    closeUpdateModal: !!closeUpdateModal,
    updateAyudaTitle: !!updateAyudaTitle
  });
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
settingsBtn.addEventListener('click', () => {
    window.location.href = '../../update-profile.html';
  });

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
// Close APPLICANTS modal
closeApplicants.addEventListener('click', () => {
  applicantsModal.style.display = 'none';
});

// Close BENEFICIARIES modal
closeBeneficiary.addEventListener('click', () => {
  beneficiaryModal.style.display = 'none';
});
window.viewApplicants = async function (ayudaId) {
  try {
    applicantsModal.style.display = 'flex';
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
          return { uid, fullName: userData.fullName || 'Unknown User' };
        } else {
          return { uid, fullName: 'Unknown User' };
        }
      })
    );

    // Render applicant list with Approve/Reject buttons
    applicantsList.innerHTML = applicantDocs
      .map(
        (a, i) => `
        <div class="applicant-item">
          <p><strong>${i + 1}.</strong> ${a.fullName}</p>
          <div class="applicant-actions">
            <button class="approve-btn" onclick="approveApplicant('${ayudaId}', '${a.uid}')">✅ Approve</button>
            <button class="reject-btn" onclick="rejectApplicant('${ayudaId}', '${a.uid}')">❌ Reject</button>
          </div>
        </div>
      `
      )
      .join('');

  } catch (error) {
    console.error('Error fetching applicants:', error);
    applicantsList.innerHTML = '<p>Failed to load applicants.</p>';
  }
};

window.approveApplicant = async function (ayudaId, userId) {
  try {
    const ayudaRef = doc(db, 'ayudas', ayudaId);
    const ayudaSnap = await getDoc(ayudaRef);

    if (!ayudaSnap.exists()) return alert('Ayuda not found.');

    const ayuda = ayudaSnap.data();

    // Remove from applicants and add to beneficiaries
    const newApplicants = (ayuda.applicants || []).filter(uid => uid !== userId);
    const newBeneficiaries = [...(ayuda.beneficiaries || []), userId];

    await updateDoc(ayudaRef, {
      applicants: newApplicants,
      beneficiaries: newBeneficiaries
    });

    alert('✅ Applicant approved!');
    viewApplicants(ayudaId); // refresh modal
  } catch (error) {
    console.error('Error approving applicant:', error);
    alert('⚠️ Failed to approve applicant.');
  }
};

// Reject applicant: remove from applicants[]
window.rejectApplicant = async function (ayudaId, userId) {
  try {
    const ayudaRef = doc(db, 'ayudas', ayudaId);
    const ayudaSnap = await getDoc(ayudaRef);

    if (!ayudaSnap.exists()) return alert('Ayuda not found.');

    const ayuda = ayudaSnap.data();
    const newApplicants = (ayuda.applicants || []).filter(uid => uid !== userId);

    await updateDoc(ayudaRef, {
      applicants: newApplicants
    });

    alert('❌ Applicant rejected.');
    viewApplicants(ayudaId); // refresh modal
  } catch (error) {
    console.error('Error rejecting applicant:', error);
    alert('⚠️ Failed to reject applicant.');
  }
};

window.viewBeneficiary = async function (ayudaId) {
  try {
    beneficiaryModal.style.display = 'flex'; // Show modal
    beneficiaryList.innerHTML = '<p>Loading applicants...</p>';

    const ayudaRef = doc(db, 'ayudas', ayudaId);
    const ayudaSnap = await getDoc(ayudaRef);

    if (!ayudaSnap.exists()) {
      beneficiaryList.innerHTML = '<p>Ayuda not found.</p>';
      return;
    }

    const ayuda = ayudaSnap.data();
    const beneficiaries = ayuda.beneficiaries || [];

    if (beneficiaries.length === 0) {
      beneficiaryList.innerHTML = '<p>No beneficiary yet.</p>';
      return;
    }

    // 🟢 Fetch user info for each applicant UID
    const beneficiarydocs = await Promise.all(
      beneficiaries.map(async (uid) => {
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
    beneficiaryList.innerHTML = beneficiarydocs
      .map((name, i) => `<p><strong>${i + 1}.</strong> ${name}</p>`)
      .join('');

  } catch (error) {
    console.error('Error fetching applicants:', error);
    beneficiaryList.innerHTML = '<p>Failed to load applicants.</p>';
  }
};

window.updateData = async function (ayudaId) {
  try {
    const ayudaRef = doc(db, 'ayudas', ayudaId);
    const ayudaSnap = await getDoc(ayudaRef);
    if (!ayudaSnap.exists()) {
      alert("Ayuda not found.");
      return;
    }

    const ayuda = ayudaSnap.data();

    // Fill fields
    updateAyudaTitle.textContent = ayuda.title;
    updateAmount.value = ayuda.amount || 0;
    updateCity.value = ayuda.city || '';
    updateBarangay.value = ayuda.barangay || '';
    updateClaimingArea.value = ayuda.claiming_area || '';
    updateDescription.value = ayuda.description || '';
    updateRequirements.value = ayuda.requirements || '';
    updateSchedule.value = ayuda.schedule ? ayuda.schedule : '';
    updateStatus.value = ayuda.status ? 'true' : 'false';

    // Show modal
    updateAyudaModal.style.display = 'flex';

    // Save ID for submission
    updateAyudaForm.dataset.id = ayudaId;

  } catch (error) {
    console.error("Error opening update modal:", error);
  }
};

// Close modal
closeUpdateModal.addEventListener('click', () => {
  updateAyudaModal.style.display = 'none';
});

// Submit form
updateAyudaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const ayudaId = updateAyudaForm.dataset.id;
  const ayudaRef = doc(db, 'ayudas', ayudaId);

  try {
    await updateDoc(ayudaRef, {
      amount: parseFloat(updateAmount.value),
      city: updateCity.value,
      barangay: updateBarangay.value,
      claiming_area: updateClaimingArea.value,
      description: updateDescription.value,
      requirements: updateRequirements.value,
      schedule: updateSchedule.value,
      status: updateStatus.value === 'true'
    });

    alert("✅ Ayuda updated successfully!");
    updateAyudaModal.style.display = 'none';
    loadAyudas(); // Refresh the list

  } catch (error) {
    console.error("Error updating ayuda:", error);
    alert("⚠️ Failed to update ayuda. Check console for details.");
  }
});
