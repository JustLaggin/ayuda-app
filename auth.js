import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail // 💡 new import
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// References
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const goToLogin = document.getElementById('goToLogin');
const goToRegister = document.getElementById('goToRegister');
const forgotPassword = document.getElementById('forgotPassword'); // 💡 new
const formContainer = document.getElementById('formContainer');
const statusMsg = document.getElementById('statusMsg');

// --- SWITCH FUNCTIONS ---
function showLogin() {
  formContainer.classList.add('fade-out');
  setTimeout(() => {
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    formContainer.classList.remove('fade-out');
    formContainer.classList.add('fade-in');
  }, 300);
}

function showRegister() {
  formContainer.classList.add('fade-out');
  setTimeout(() => {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    formContainer.classList.remove('fade-out');
    formContainer.classList.add('fade-in');
  }, 300);
}

// --- NAVIGATION ---
if (goToLogin) goToLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
if (goToRegister) goToRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });

// --- REGISTER ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('registerFirstName').value.trim();
  const lastName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  if (!firstName || !lastName || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      role: "user"
    });

    await signOut(auth);
    alert("✅ Registration successful! Please log in.");
    showLogin();

  } catch (error) {
    console.error("Error during registration:", error);
    alert(error.message);
  }
});

// --- LOGIN ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    const userData = userDoc.data();

    if (userData.role === 'admin') {
      window.location = 'admin-dashboard.html';
    } else {
      window.location = 'user-dashboard.html';
    }

  } catch (err) {
    console.error("Login error:", err);
    statusMsg.textContent = '❌ ' + err.message;
  }
});

// --- ENTER KEY SUPPORT ---
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginForm.dispatchEvent(new Event('submit'));
  }
});

// --- 💡 FORGOT PASSWORD FEATURE ---
forgotPassword.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  if (!email) {
    alert("Please enter your email to reset your password.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("📧 Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("Password reset error:", error);
    alert(error.message);
  }
});
